package com.gestion.tpbackend.service;

import com.gestion.tpbackend.entity.Edificio;
import com.gestion.tpbackend.entity.Usuario;
import com.gestion.tpbackend.repository.EdificioRepository;
import com.gestion.tpbackend.repository.UsuarioRepository;
import com.gestion.tpbackend.repository.UnidadRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class EdificioService {

    private final EdificioRepository edificioRepository;
    private final UsuarioRepository usuarioRepository;
    private final UnidadRepository unidadRepository;

    public EdificioService(EdificioRepository edificioRepository, UsuarioRepository usuarioRepository, UnidadRepository unidadRepository) {
        this.edificioRepository = edificioRepository;
        this.usuarioRepository = usuarioRepository;
        this.unidadRepository = unidadRepository;
    }

    public List<Edificio> obtenerTodos() {
        return edificioRepository.findAll();
    }

    public Edificio obtenerPorId(Long id) {
        return edificioRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Edificio no encontrado"));
    }

    public Edificio crear(String nombre, String direccion, Integer cantidadDepartamentos, Integer cantidadInquilinos, Double expensasBase, Long propietarioId) {
        Usuario propietario = obtenerPropietario(propietarioId);
        Edificio edificio = new Edificio(nombre, direccion, cantidadDepartamentos, cantidadInquilinos, expensasBase, propietario);
        return edificioRepository.save(edificio);
    }

    public Edificio actualizar(Long id, String nombre, String direccion, Integer cantidadDepartamentos, Integer cantidadInquilinos, Double expensasBase, Long propietarioId) {
        Edificio edificio = obtenerPorId(id);
        Usuario propietario = obtenerPropietario(propietarioId);
        edificio.setNombre(nombre);
        edificio.setDireccion(direccion);
        edificio.setCantidadDepartamentos(cantidadDepartamentos);
        edificio.setCantidadInquilinos(cantidadInquilinos);
        edificio.setExpensasBase(expensasBase);
        edificio.setPropietario(propietario);
        return edificioRepository.save(edificio);
    }

    public Edificio agregarGastoExtra(Long id, Double monto) {
        if (monto == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El monto del gasto es obligatorio");
        }

        Edificio edificio = obtenerPorId(id);
        Double gastoActual = edificio.getGastosExtra() != null ? edificio.getGastosExtra() : 0.0;
        edificio.setGastosExtra(gastoActual + monto);
        return edificioRepository.save(edificio);
    }

    public void eliminar(Long id) {
        Edificio edificio = obtenerPorId(id);
        edificioRepository.delete(edificio);
    }

    private Usuario obtenerPropietario(Long propietarioId) {
        return usuarioRepository.findById(propietarioId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Propietario no encontrado"));
    }

    public List<Edificio> getEdificiosDelInquilinoPorEmail(String email) {
        Usuario inquilino = usuarioRepository.findByEmail(email)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Inquilino no encontrado"));
        return unidadRepository.findEdificiosByInquilinoId(inquilino.getId());
    }
}
