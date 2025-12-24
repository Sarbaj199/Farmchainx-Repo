package com.example.backend.service;

import com.example.backend.entity.Distributor;
import com.example.backend.repository.DistributorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class DistributorService {
    
    @Autowired
    private DistributorRepository distributorRepository;

    public Distributor createDistributor(Distributor distributor) {
        return distributorRepository.save(distributor);
    }

    public Distributor getDistributorById(Long id) {
        return distributorRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Distributor not found"));
    }

    public List<Distributor> getAllDistributors() {
        return distributorRepository.findAll();
    }

    public Distributor updateDistributor(Distributor distributor) {
        getDistributorById(distributor.getDistributorId()); // Check if exists
        return distributorRepository.save(distributor);
    }

    public void deleteDistributor(Long id) {
        distributorRepository.deleteById(id);
    }

    public Optional<Distributor> getDistributorByUserId(Long id) {
        return distributorRepository.findAll().stream()
            .filter(distributor -> distributor.getUser().getId().equals(id))
            .findFirst();
    }
}