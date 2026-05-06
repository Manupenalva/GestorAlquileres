package com.gestion.tpbackend.controller;

import com.gestion.tpbackend.entity.Contrato;
import com.gestion.tpbackend.entity.Contrato.MetodoPago;
import com.gestion.tpbackend.entity.HistorialContrato;
import com.gestion.tpbackend.entity.Usuario;
import com.gestion.tpbackend.repository.HistorialContratoRepository;
import com.gestion.tpbackend.repository.UsuarioRepository;
import com.gestion.tpbackend.service.ContratoService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/pagos")
public class ContratoController {

    private final ContratoService contratoService;
    private final HistorialContratoRepository historialContratoRepository;
    private final UsuarioRepository usuarioRepository;

    public ContratoController(ContratoService contratoService, 
                             HistorialContratoRepository historialContratoRepository,
                             UsuarioRepository usuarioRepository) {
        this.contratoService = contratoService;
        this.historialContratoRepository = historialContratoRepository;
        this.usuarioRepository = usuarioRepository;
    }

    /**
     * El inquilino consulta su historial de contratos (alquileres).
     */
    @PreAuthorize("hasRole('INQ')")
    @GetMapping("/mis-contratos")
    public ResponseEntity<List<HistorialContrato>> misContratos(Authentication auth) {
        Usuario inquilino = usuarioRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Inquilino no encontrado"));
        return ResponseEntity.ok(historialContratoRepository.findByInquilinoId(inquilino.getId()));
    }

    /**
     * Admin consulta el historial de un inquilino especifico (pagos y contratos).
     */
    @GetMapping("/inquilino/{inquilinoId}/historial")
    public ResponseEntity<HistorialCompletoResponse> historialInquilino(@PathVariable Long inquilinoId) {
        List<Contrato> pagos = contratoService.obtenerPorInquilinoId(inquilinoId);
        List<HistorialContrato> contratos = historialContratoRepository.findByInquilinoId(inquilinoId);
        return ResponseEntity.ok(new HistorialCompletoResponse(pagos, contratos));
    }

    public record HistorialCompletoResponse(List<Contrato> pagos, List<HistorialContrato> contratos) {}

    /**
     * El inquilino registra un pago.
     * TARJETA → PAGADO | EFECTIVO → PENDIENTE
     */
    @PreAuthorize("hasRole('INQ')")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Contrato registrarPago(@RequestBody PagoRequest request, Authentication auth) {
        String email = auth.getName();
        MetodoPago metodo = MetodoPago.valueOf(request.metodo().toUpperCase());
        return contratoService.registrarPago(email, request.edificioId(), request.monto(), metodo, request.nota());
    }

    /**
     * El inquilino consulta su historial de pagos.
     */
    @PreAuthorize("hasRole('INQ')")
    @GetMapping("/mis-pagos")
    public ResponseEntity<List<Contrato>> misPagos(Authentication auth) {
        return ResponseEntity.ok(contratoService.obtenerPorInquilino(auth.getName()));
    }

    /**
     * Admin/propietario consulta pagos por edificio.
     */
    @GetMapping("/edificio/{edificioId}")
    public ResponseEntity<List<Contrato>> pagosPorEdificio(@PathVariable Long edificioId) {
        return ResponseEntity.ok(contratoService.obtenerPorEdificio(edificioId));
    }

    /**
     * Admin/propietario lista todos los pagos.
     */
    @GetMapping
    public ResponseEntity<List<Contrato>> todos() {
        return ResponseEntity.ok(contratoService.obtenerTodos());
    }

    /**
     * Admin/propietario confirma un pago en efectivo (PENDIENTE → PAGADO).
     */
    @PatchMapping("/{id}/confirmar")
    public ResponseEntity<Contrato> confirmar(@PathVariable Long id) {
        return ResponseEntity.ok(contratoService.marcarComoPagado(id));
    }

    public record PagoRequest(Long edificioId, Double monto, String metodo, String nota) {}
}