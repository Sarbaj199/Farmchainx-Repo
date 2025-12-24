package com.example.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonManagedReference;

@Entity
@Table(name = "farmers")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Farmer {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long farmerId;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private String farmName;
    private String farmLocation;
    private String farmSize;
    private String contactNumber;
    private Boolean isVerified = false;

    // Crops relationship
    @JsonIgnoreProperties({"farmer","batches"})
    @OneToMany(mappedBy = "farmer", cascade = CascadeType.ALL)
    private List<Crop> crops;

}
