package com.gestion.tpbackend.controller;

import com.gestion.tpbackend.entity.Unidad;
import com.gestion.tpbackend.service.UnidadService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/unidades")
public class UnidadController {

    private final UnidadService unidadService;

    public UnidadController(UnidadService unidadService) {
        this.unidadService = unidadService;
    }

    @GetMapping
    public List<Unidad> listarTodas() {
        return unidadService.obtenerTodas();
    }

    @GetMapping("/edificio/{edificioId}")
    public List<Unidad> listarPorEdificio(@PathVariable Long edificioId) {
        return unidadService.obtenerPorEdificio(edificioId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Unidad crear(@RequestBody UnidadRequest request) {
        return unidadService.crear(request.nombre(), request.metrosCuadrados(), request.piso(), request.edificioId());
    }

    @PatchMapping("/{id}/inquilino/{inquilinoId}")
    public Unidad asignar(@PathVariable Long id, @PathVariable Long inquilinoId) {
        return unidadService.asignarInquilino(id, inquilinoId);
    }

    @PostMapping("/asignar-por-email")
    public Unidad asignarPorEmail(@RequestBody AsignarInquilinoRequest request) {
        return unidadService.asignarInquilinoPorEmail(
            request.edificioId(), 
            request.piso(), 
            request.nombre(), 
            request.email(),
            request.montoAlquiler(),
            request.porcentajeDepartamento(),
            request.diaPago(),
            request.vencimientoContrato()
        );
    }

    @DeleteMapping("/{id}/inquilino")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void quitarInquilino(@PathVariable Long id) {
        unidadService.quitarInquilino(id);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminar(@PathVariable Long id) {
        unidadService.eliminar(id);
    }

    public record UnidadRequest(String nombre, Double metrosCuadrados, String piso, Long edificioId) {}
    public record AsignarInquilinoRequest(Long edificioId, String piso, String nombre, String email, Double montoAlquiler, Double porcentajeDepartamento, Integer diaPago, String vencimientoContrato) {}
}