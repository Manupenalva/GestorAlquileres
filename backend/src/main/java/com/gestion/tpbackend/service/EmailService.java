package com.gestion.tpbackend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.time.format.DateTimeFormatter;

@Service
public class EmailService {
    @Autowired
    private JavaMailSender mailSender;
    @Value("${app.frontend.url}")
    private String frontendUrl;

    public void enviarConfirmacionPago(String email, String nombre, List<Map<String, Object>> gastos) {
        String subject = "Confirmación de Pago - Edificio";
        StringBuilder text = new StringBuilder();
        text.append("Hola ").append(nombre).append(",\n\n");
        text.append("Tu pago ha sido registrado exitosamente. Aquí están los detalles de tu pago:\n\n");

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm").withZone(ZoneId.systemDefault());

        for (Map<String, Object> gasto : gastos) {
            text.append("- ").append(gasto.get("descripcion")).append(": $").append(gasto.get("monto"))
                .append(" (").append(formatter.format(((java.time.Instant) gasto.get("fecha")).atZone(ZoneId.systemDefault()))).append(")\n");
        }

        text.append("\nPuedes ver más detalles en tu perfil: ").append(frontendUrl).append("/mis-edificios\n");
        text.append("\nGracias por tu pago!");

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject(subject);
        message.setText(text.toString());
        mailSender.send(message);
    }

    public void enviarAdminConfirmarPago(String email, String nombre, List<Map<String, Object>> gastos) {
        String subject = "Nuevo Pago Registrado - Edificio";
        StringBuilder text = new StringBuilder();
        text.append("Hola ").append(nombre).append(",\n\n");
        text.append("Se ha registrado un nuevo pago. Aquí están los detalles:\n\n");

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm").withZone(ZoneId.systemDefault());

        for (Map<String, Object> gasto : gastos) {
            text.append("- ").append(gasto.get("descripcion")).append(": $").append(gasto.get("monto"))
                .append(" (").append(formatter.format(((java.time.Instant) gasto.get("fecha")).atZone(ZoneId.systemDefault()))).append(")\n");
        }

        text.append("\nPor favor, revisa el pago en el panel de administración: ").append(frontendUrl).append("\n");
        text.append("\nGracias!");

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject(subject);
        message.setText(text.toString());
        mailSender.send(message);
    }

    public void enviarPagoEfectivo(String email, String nombre, List<Map<String, Object>> gastos) {
        String subject = "Pago en Efectivo Registrado - Edificio";
        StringBuilder text = new StringBuilder();
        text.append("Hola ").append(nombre).append(",\n\n");
        text.append("Tu pago en efectivo ha sido registrado exitosamente. Aquí están los detalles de tu pago:\n\n");

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm").withZone(ZoneId.systemDefault());

        for (Map<String, Object> gasto : gastos) {
            text.append("- ").append(gasto.get("descripcion")).append(": $").append(gasto.get("monto"))
                .append(" (").append(formatter.format(((java.time.Instant) gasto.get("fecha")).atZone(ZoneId.systemDefault()))).append(")\n");
        }

        text.append("\nPuedes ver más detalles en tu perfil: ").append(frontendUrl).append("/mis-edificios\n");
        text.append("\nGracias por tu pago!");

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject(subject);
        message.setText(text.toString());
        mailSender.send(message);
    }

    public void enviarAdminPagoEfectivo(String email, String nombre, List<Map<String, Object>> gastos) {
        String subject = "Nuevo Pago en Efectivo Registrado - Edificio";
        StringBuilder text = new StringBuilder();
        text.append("Hola ").append(nombre).append(",\n\n");
        text.append("Se ha registrado un nuevo pago en efectivo. Aquí están los detalles:\n\n");

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm").withZone(ZoneId.systemDefault());

        for (Map<String, Object> gasto : gastos) {
            text.append("- ").append(gasto.get("descripcion")).append(": $").append(gasto.get("monto"))
                .append(" (").append(formatter.format(((java.time.Instant) gasto.get("fecha")).atZone(ZoneId.systemDefault()))).append(")\n");
        }

        text.append("\nPor favor, revisa el pago en el panel de administración: ").append(frontendUrl).append("\n");
        text.append("\nGracias!");

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject(subject);
        message.setText(text.toString());
        mailSender.send(message);
    }

    public void adminConfirmarEfectivoCliente(String email, String nombre, List<Map<String, Object>> gastos) {
        String subject = "Confirmación de Pago en Efectivo - Edificio";
        StringBuilder text = new StringBuilder();
        text.append("Hola ").append(nombre).append(",\n\n");
        text.append("Tu pago en efectivo ha sido confirmado por el administrador. Aquí están los detalles de tu pago:\n\n");

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm").withZone(ZoneId.systemDefault());

        for (Map<String, Object> gasto : gastos) {
            text.append("- ").append(gasto.get("descripcion")).append(": $").append(gasto.get("monto"))
                .append(" (").append(formatter.format(((java.time.Instant) gasto.get("fecha")).atZone(ZoneId.systemDefault()))).append(")\n");
        }

        text.append("\nPuedes ver más detalles en tu perfil: ").append(frontendUrl).append("/perfil\n");
        text.append("\nGracias por tu pago!");

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject(subject);
        message.setText(text.toString());
        mailSender.send(message);
    }
}