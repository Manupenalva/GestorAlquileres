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
        return unidadRepository.save(unidad);
    }

    public void eliminar(Long id) {
        Unidad unidad = obtenerPorId(id);
        unidadRepository.delete(unidad);
    }
}