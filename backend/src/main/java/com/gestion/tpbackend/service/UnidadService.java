package com.gestion.tpbackend.service;

import com.gestion.tpbackend.entity.Edificio;
import com.gestion.tpbackend.entity.HistorialContrato;
import com.gestion.tpbackend.entity.Unidad;
import com.gestion.tpbackend.entity.Usuario;
import com.gestion.tpbackend.repository.EdificioRepository;
import com.gestion.tpbackend.repository.HistorialContratoRepository;
import com.gestion.tpbackend.repository.UnidadRepository;
import com.gestion.tpbackend.repository.UsuarioRepository;
import java.time.YearMonth;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class UnidadService {

    private final UnidadRepository unidadRepository;
    private final EdificioRepository edificioRepository;
    private final UsuarioRepository usuarioRepository;
    private final HistorialContratoRepository historialContratoRepository;
    private final DeudaService deudaService;

    public UnidadService(
        UnidadRepository unidadRepository,
        EdificioRepository edificioRepository,
        UsuarioRepository usuarioRepository,
        HistorialContratoRepository historialContratoRepository,
        DeudaService deudaService
    ) {
        this.unidadRepository = unidadRepository;
        this.edificioRepository = edificioRepository;
        this.usuarioRepository = usuarioRepository;
        this.historialContratoRepository = historialContratoRepository;
        this.deudaService = deudaService;
    }

    public List<Unidad> obtenerTodas() {
        return unidadRepository.findAll();
    }

    public List<Unidad> obtenerPorEdificio(Long edificioId) {
        return unidadRepository.findByEdificioId(edificioId);
    }

    public Unidad obtenerPorId(Long id) {
        return unidadRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Unidad no encontrada"));
    }

    public Unidad crear(String nombre, Double m2, String piso, Long edificioId) {
        Edificio edificio = edificioRepository.findById(edificioId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Edificio no encontrado"));
        Unidad unidad = new Unidad(nombre, m2, piso, edificio);
        return unidadRepository.save(unidad);
    }

    public Unidad asignarInquilino(Long unidadId, Long inquilinoId) {
        Unidad unidad = obtenerPorId(unidadId);
        Usuario inquilino = usuarioRepository.findById(inquilinoId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Inquilino no encontrado"));
        
        // Cerrar historial previo si existia
        cerrarHistorialActual(unidad);

        unidad.setInquilino(inquilino);
        Unidad unidadGuardada = unidadRepository.save(unidad);

        deudaService.asegurarDeudaBaseMensual(unidadGuardada, YearMonth.now());
        
        // Crear nuevo historial
        HistorialContrato historial = new HistorialContrato(unidad, inquilino, unidad.getMontoAlquiler() != null ? unidad.getMontoAlquiler() : 0.0, unidad.getVencimientoContrato(), java.time.LocalDateTime.now());
        historialContratoRepository.save(historial);

        actualizarCantidadInquilinos(unidad.getEdificio());
        
        return unidadGuardada;
    }

    public Unidad asignarInquilinoPorEmail(Long edificioId, String piso, String nombre, String email, Double montoAlquiler, Double porcentajeDepartamento, Integer diaPago, String vencimientoContrato) {
        Usuario inquilino = usuarioRepository.findByEmail(email)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "El usuario con email " + email + " no existe."));
            
        Edificio edificio = edificioRepository.findById(edificioId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Edificio no encontrado"));
            
        Unidad unidad = unidadRepository.findByEdificioIdAndPisoAndNombre(edificioId, piso, nombre)
            .orElseGet(() -> new Unidad(nombre, 0.0, piso, edificio));
            
        // Cerrar historial previo si el inquilino cambia o se esta re-asignando
        if (unidad.getInquilino() != null) {
            cerrarHistorialActual(unidad);
        }

        unidad.setInquilino(inquilino);
        unidad.setMontoAlquiler(montoAlquiler);
        unidad.setPorcentajeDepartamento(porcentajeDepartamento);
        unidad.setDiaPago(diaPago);
        unidad.setVencimientoContrato(vencimientoContrato);
        
        Unidad unidadGuardada = unidadRepository.save(unidad);

        deudaService.asegurarDeudaBaseMensual(unidadGuardada, YearMonth.now());
        
        // Crear nuevo historial
        HistorialContrato historial = new HistorialContrato(unidad, inquilino, montoAlquiler, vencimientoContrato, java.time.LocalDateTime.now());
        historialContratoRepository.save(historial);

        actualizarCantidadInquilinos(edificio);
        
        return unidadGuardada;
    }

    public void quitarInquilino(Long unidadId) {
        Unidad unidad = obtenerPorId(unidadId);
        
        cerrarHistorialActual(unidad);

        unidad.setInquilino(null);
        unidad.setMontoAlquiler(null);
        unidad.setDiaPago(null);
        unidad.setVencimientoContrato(null);
        
        unidadRepository.save(unidad);
        actualizarCantidadInquilinos(unidad.getEdificio());
    }

    private void cerrarHistorialActual(Unidad unidad) {
        List<HistorialContrato> historiales = historialContratoRepository.findByUnidadId(unidad.getId());
        historiales.stream()
            .filter(h -> h.getFechaFin() == null)
            .forEach(h -> {
                h.setFechaFin(java.time.LocalDateTime.now());
                historialContratoRepository.save(h);
            });
    }

    private void actualizarCantidadInquilinos(Edificio edificio) {
        List<Unidad> unidades = unidadRepository.findByEdificioId(edificio.getId());
        long count = unidades.stream()
            .filter(u -> u.getInquilino() != null)
            .count();
        edificio.setCantidadInquilinos((int) count);
        edificioRepository.save(edificio);
    }

    public void eliminar(Long id) {
        Unidad unidad = obtenerPorId(id);
        Edificio edificio = unidad.getEdificio();
        unidadRepository.delete(unidad);
        actualizarCantidadInquilinos(edificio);
    }
}