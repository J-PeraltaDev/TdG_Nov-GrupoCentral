-- RF-31 (Sprint 5): el webhook de los avisos. Fuente: SDD 6.1.6 (Figura 17) y 5.3.5; plan del
-- Sprint 5, decisiones 38 a 42.
--
-- Cada aviso nuevo en `notificacion` encola, con pg_net, un POST a la Edge Function enviar-push
-- con el aviso como `record` (como los webhooks de Supabase) y el encabezado x-webhook-secreto.
-- Es un disparador propio y no el «Database Webhook» del panel, que guardaría el secreto en la
-- definición del disparador (en esta migración, en un repositorio público).
--
-- La URL y el secreto viven en Vault (`enviar_push_url` y `enviar_push_secreto`): los pone
-- `npm run staging:secretos` en «staging» y una persona en «PROYECTO» (decisión 40). Si falta
-- alguno (el Supabase local del CI, pgTAP), no se envía nada y el aviso se crea igual.
--
-- pg_net encola en la misma transacción: si la transición falla, la solicitud se revierte con
-- ella. La entrega ocurre después del commit, en el proceso de pg_net, y no frena la transición.

create function private.tg_notificacion_push()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_url text;
  v_secreto text;
begin
  select
    max(s.decrypted_secret) filter (where s.name = 'enviar_push_url'),
    max(s.decrypted_secret) filter (where s.name = 'enviar_push_secreto')
  into v_url, v_secreto
  from vault.decrypted_secrets s
  where s.name in ('enviar_push_url', 'enviar_push_secreto');

  if v_url is null or v_secreto is null then
    return null;
  end if;

  perform net.http_post(
    url := v_url,
    body := jsonb_build_object('record', to_jsonb(new)),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secreto', v_secreto
    ),
    timeout_milliseconds := 5000
  );

  return null;
end;
$$;

comment on function private.tg_notificacion_push() is
  'Encola el POST a enviar-push por cada aviso nuevo, con la URL y el secreto de Vault; sin ellos no hace nada (RF-31, SDD 6.1.6).';

revoke execute on function private.tg_notificacion_push() from public, anon, authenticated;

create trigger notificacion_push
after insert on public.notificacion
for each row execute function private.tg_notificacion_push();

-- Privilegios de service_role (regla 4) --------------------------------------------------------
-- enviar-push lee la novedad (con su finca, área y tipo de falla), el rol del destinatario y sus
-- suscripciones, y borra las que el servicio push ya no reconoce (404 o 410). En «staging»
-- service_role ya los tiene, pero una migración no depende de los privilegios por defecto del
-- proyecto. `usuario` ya tiene select desde rf03.

grant select on public.novedad, public.finca, public.area, public.tipo_falla to service_role;
grant select, delete on public.suscripcion_push to service_role;
