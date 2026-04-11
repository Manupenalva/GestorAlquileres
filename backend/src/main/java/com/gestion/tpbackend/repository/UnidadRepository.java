package com.gestion.tpbackend.repository;

import com.gestion.tpbackend.entity.Unidad;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface UnidadRepository extends JpaRepository<Unidad, Long> {
    List<Unidad> findByEdificioId(Long edificioId);
    Optional<Unidad> findByEdificioIdAndPisoAndNombre(Long edificioId, String piso, String nombre);
}