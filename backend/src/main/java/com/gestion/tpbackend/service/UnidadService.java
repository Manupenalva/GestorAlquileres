package com.gestion.tpbackend.service;

import com.gestion.tpbackend.entity.Edificio;
import com.gestion.tpbackend.entity.Unidad;
import com.gestion.tpbackend.entity.Usuario;
import com.gestion.tpbackend.repository.EdificioRepository;
import com.gestion.tpbackend.repository.UnidadRepository;
import com.gestion.tpbackend.repository.UsuarioRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class UnidadService {

    private final UnidadRepository unidadRepository;
    private final EdificioRepository edificioRepository;
    private final UsuarioRepository usuarioRepository;

    public UnidadService(UnidadRepository unidadRepository, EdificioRepository edificioRepository, UsuarioRepository usuarioRepository) {
        this.unidadRepository = unidadRepository;
        this.edificioRepository = edificioRepository;
        this.usuarioRepository = usuarioRepository;
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
        
        unidad.setInquilino(inquilino);
        Unidad unidadGuardada = unidadRepository.save(unidad);
        
        actualizarCantidadInquilinos(unidad.getEdificio());
        
        return unidadGuardada;
    }

    public Unidad asignarInquilinoPorEmail(Long edificioId, String piso, String nombre, String email, Double montoAlquiler, Integer diaPago, String vencimientoContrato) {
        Usuario inquilino = usuarioRepository.findByEmail(email)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "El usuario con email " + email + " no existe."));
            
        Edificio edificio = edificioRepository.findById(edificioId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Edificio no encontrado"));
            
        Unidad unidad = unidadRepository.findByEdificioIdAndPisoAndNombre(edificioId, piso, nombre)
            .orElseGet(() -> new Unidad(nombre, 0.0, piso, edificio));
            
        unidad.setInquilino(inquilino);
        unidad.setMontoAlquiler(montoAlquiler);
        unidad.setDiaPago(diaPago);
        unidad.setVencimientoContrato(vencimientoContrato);
        
        Unidad unidadGuardada = unidadRepository.save(unidad);
        
        actualizarCantidadInquilinos(edificio);
        
        return unidadGuardada;
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