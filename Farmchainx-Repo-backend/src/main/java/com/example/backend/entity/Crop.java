package com.example.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDate;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonManagedReference;

@Entity
@Table(name = "crops")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Crop {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long cropId;

    private String name;
    private String variety;
    private String season;
    private String growingPeriod;
    private String description;
    private Double pricePerKg;
    private Double quantityAvailable;
    // @Column(length = 100000)
    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String imageUrl;
    
    @Column(columnDefinition = "TEXT")
    private String qrCodeBase64;
    private LocalDate harvestDate;

    @ManyToOne
    @JoinColumn(name = "farmer_id")
    @JsonIgnoreProperties({"crops","batches"})
    private Farmer farmer;


    @OneToMany(mappedBy = "crop", cascade = CascadeType.ALL)
    @JsonIgnoreProperties({"crop","farmer","transactions"})
    @JsonIgnore
    private List<Batch> batches;

    @OneToMany(mappedBy = "crop", cascade = CascadeType.ALL)
    @JsonIgnoreProperties({"crop", "user", "transaction"})
    private List<Review> reviews;
}