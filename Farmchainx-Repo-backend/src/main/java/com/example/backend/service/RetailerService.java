package com.example.backend.service;

import com.example.backend.entity.Retailer;
import com.example.backend.repository.RetailerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class RetailerService {
    
    @Autowired
    private RetailerRepository retailerRepository;

    public Retailer createRetailer(Retailer retailer) {
        return retailerRepository.save(retailer);
    }

    public Retailer getRetailerById(Long id) {
        return retailerRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Retailer not found"));
    }

    public List<Retailer> getAllRetailers() {
        return retailerRepository.findAll();
    }

    public Retailer updateRetailer(Retailer retailer) {
        getRetailerById(retailer.getRetailerId()); // Check if exists
        return retailerRepository.save(retailer);
    }

    public void deleteRetailer(Long id) {
        retailerRepository.deleteById(id);
    }

    public Optional<Retailer> getRetailerByUserId(Long id) {
        return retailerRepository.findAll().stream()
            .filter(retailer -> retailer.getUser().getId().equals(id))
            .findFirst();
    }
}