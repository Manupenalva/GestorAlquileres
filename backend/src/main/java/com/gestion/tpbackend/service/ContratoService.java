package com.gestion.tpbackend.service;

import com.gestion.tpbackend.entity.Contrato;
import com.gestion.tpbackend.entity.Contrato.EstadoPago;
import com.gestion.tpbackend.entity.Contrato.MetodoPago;
import com.gestion.tpbackend.entity.Unidad;
import com.gestion.tpbackend.entity.Usuario;
import com.gestion.tpbackend.repository.ContratoRepository;
import com.gestion.tpbackend.repository.UnidadRepository;
import com.gestion.tpbackend.repository.UsuarioRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;    
import java.time.Instant; // Importante
import java.util.ArrayList;

@Service
public class ContratoService {

    private final ContratoRepository contratoRepository;
    private final UsuarioRepository usuarioRepository;
    private final UnidadRepository unidadRepository;
    private final EmailService emailService;

    public ContratoService(ContratoRepository contratoRepository,
                           UsuarioRepository usuarioRepository,
                           UnidadRepository unidadRepository, EmailService emailService) {
        this.contratoRepository = contratoRepository;
        this.usuarioRepository = usuarioRepository;
        this.unidadRepository = unidadRepository;
        this.emailService = emailService;
    }

    /**
     * Registra un pago. El estado se determina por el método:
     * - TARJETA → PAGADO
     * - EFECTIVO → PENDIENTE
     */
    public Contrato registrarPago(String emailInquilino, Long edificioId, Double monto, MetodoPago metodo, String nota) {  
        Usuario inquilino = usuarioRepository.findByEmail(emailInquilino)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Inquilino no encontrado"));

        Unidad unidad = unidadRepository.findAll().stream()
                .filter(u -> u.getInquilino() != null
                        && u.getInquilino().getId().equals(inquilino.getId())
                        && u.getEdificio().getId().equals(edificioId))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "No se encontró una unidad asignada a este inquilino en el edificio indicado"));

        EstadoPago estado = (metodo == MetodoPago.TARJETA) ? EstadoPago.PAGADO : EstadoPago.PENDIENTE;

        Contrato contrato = new Contrato(unidad, inquilino, monto, metodo, estado, nota);
        Contrato contratoGuardado = contratoRepository.save(contrato);

        List<Map<String, Object>> detallesPago = new ArrayList<>();
        Instant ahora = Instant.now();

        Double alquiler = unidad.getMontoAlquiler() != null ? unidad.getMontoAlquiler() : 0.0;
        Double expensasBase = unidad.getEdificio().getExpensasBase() != null ? unidad.getEdificio().getExpensasBase() : 0.0;
        Double gastosExtra = unidad.getEdificio().getGastosExtra() != null ? unidad.getEdificio().getGastosExtra() : 0.0;

        if (alquiler > 0) {
            detallesPago.add(Map.of("descripcion", "Alquiler mensual", "monto", alquiler, "fecha", ahora));
        }
        if (expensasBase > 0) {
            detallesPago.add(Map.of("descripcion", "Expensas Ordinarias", "monto", expensasBase, "fecha", ahora));
        }
        if (gastosExtra > 0) {
            detallesPago.add(Map.of("descripcion", "Gastos Extraordinarios", "monto", gastosExtra, "fecha", ahora));
        }

        Usuario propietarioEdificio = unidad.getEdificio().getPropietario();
    
        if (propietarioEdificio != null && propietarioEdificio.getEmail() != null) {
            String emailPropietario = propietarioEdificio.getEmail();
            String nombrePropietario = propietarioEdificio.getNombre();

            if (metodo == MetodoPago.TARJETA) {
                emailService.enviarConfirmacionPago(inquilino.getEmail(), inquilino.getNombre(), detallesPago, metodo, nota, unidad);
                emailService.enviarAdminConfirmarPago(propietarioEdificio.getEmail(), propietarioEdificio.getNombre(), detallesPago, inquilino.getNombre(), metodo, nota, unidad);
            } else if (metodo == MetodoPago.EFECTIVO) {
                emailService.enviarPagoEfectivo(inquilino.getEmail(), inquilino.getNombre(), detallesPago, metodo, nota, unidad);
                emailService.enviarAdminPagoEfectivo(propietarioEdificio.getEmail(), propietarioEdificio.getNombre(), detallesPago, inquilino.getNombre(), metodo, nota, unidad);
            }
        } 

        return contratoGuardado;
    }

    public List<Contrato> obtenerPorInquilino(String email) {
        Usuario inquilino = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Inquilino no encontrado"));
        return contratoRepository.findByInquilinoId(inquilino.getId());
    }

    public List<Contrato> obtenerPorInquilinoId(Long id) {
        return contratoRepository.findByInquilinoId(id);
    }

    public List<Contrato> obtenerPorEdificio(Long edificioId) {
        return contratoRepository.findByUnidadEdificioId(edificioId);
    }

    public List<Contrato> obtenerTodos() {
        return contratoRepository.findAll();
    }

    public Contrato marcarComoPagado(Long contratoId) {
        Contrato contrato = contratoRepository.findById(contratoId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Contrato no encontrado"));
        
        contrato.setEstado(EstadoPago.PAGADO);
        Contrato contratoActualizado = contratoRepository.save(contrato);

        List<Map<String, Object>> detallesPago = List.of(
            Map.of("descripcion", "Pago de expensas/alquiler", "monto", contrato.getMonto(), "fecha", Instant.now())
        );
        
        Usuario inquilino = contrato.getInquilino();
        emailService.adminConfirmarEfectivoCliente(inquilino.getEmail(), inquilino.getNombre(), detallesPago);

        return contratoActualizado;
    }
}