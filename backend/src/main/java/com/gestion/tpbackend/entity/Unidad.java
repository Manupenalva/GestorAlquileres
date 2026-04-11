package com.gestion.tpbackend.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;

@Entity
@Table(name = "unidades")
public class Unidad {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String nombre;

    @Column(nullable = false)
    private Double metrosCuadrados;

    @Column(length = 20)
    private String piso;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "edificio_id", nullable = false)
    @JsonIgnoreProperties({"unidades", "hibernateLazyInitializer", "handler"})
    private Edificio edificio;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inquilino_id")
    @JsonIgnoreProperties({"edificios", "contrasena", "hibernateLazyInitializer", "handler"})
    private Usuario inquilino;

    public Unidad() {
    }

    public Unidad(String nombre, Double metrosCuadrados, String piso, Edificio edificio) {
        this.nombre = nombre;
        this.metrosCuadrados = metrosCuadrados;
        this.piso = piso;
        this.edificio = edificio;
    }

    public Long getId() { 
        return id; 
    }

    public String getNombre() { 
        return nombre; 
    }

    public void setNombre(String nombre) { 
        this.nombre = nombre; 
    }

    public Double getMetrosCuadrados() { 
        return metrosCuadrados; 
    }

    public void setMetrosCuadrados(Double metrosCuadrados) { 
        this.metrosCuadrados = metrosCuadrados; 
    }

    public String getPiso() { 
        return piso; 
    }

    public void setPiso(String piso) { 
        this.piso = piso; 
    }

    public Edificio getEdificio() { 
        return edificio; 
    }

    public void setEdificio(Edificio edificio) { 
        this.edificio = edificio; 
    }

    public Usuario getInquilino() { 
        return inquilino; 
    }
    
    public void setInquilino(Usuario inquilino) { 
        this.inquilino = inquilino; 
    }
}