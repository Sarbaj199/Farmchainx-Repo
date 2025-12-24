package com.example.backend.service;

import com.example.backend.entity.Farmer;
import com.example.backend.entity.User;
import com.example.backend.repository.FarmerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class FarmerService {
    
    @Autowired
    private FarmerRepository farmerRepository;

    public Farmer createFarmer(Farmer farmer) {
        return farmerRepository.save(farmer);
    }

    public Farmer getFarmerById(Long id) {
        return farmerRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Farmer not found"));
    }

    public List<Farmer> getAllFarmers() {
        return farmerRepository.findAll();
    }

    public Farmer updateFarmer(Farmer farmer) {
        getFarmerById(farmer.getFarmerId()); // Check if exists
        return farmerRepository.save(farmer);
    }

    public void deleteFarmer(Long id) {
        farmerRepository.deleteById(id);
    }

    public User getUserByFarmerId(Long farmerId) {
        Farmer farmer = farmerRepository.findById(farmerId)
                .orElseThrow(() -> new RuntimeException("Farmer not found"));

        return farmer.getUser();
    }


    public Optional<Farmer> getFarmerByUserId(Long id) {
        return farmerRepository.findAll().stream()
            .filter(farmer -> farmer.getUser().getId().equals(id))
            .findFirst();
    }
}