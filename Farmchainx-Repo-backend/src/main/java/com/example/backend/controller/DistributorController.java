package com.example.backend.controller;

import com.example.backend.entity.Distributor;
import com.example.backend.service.DistributorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/distributor")
public class DistributorController {
    
    @Autowired
    private DistributorService distributorService;

    @PostMapping
    public ResponseEntity<Distributor> createDistributor(@RequestBody Distributor distributor) {
        return ResponseEntity.ok(distributorService.createDistributor(distributor));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Distributor> getDistributor(@PathVariable Long id) {
        return ResponseEntity.ok(distributorService.getDistributorById(id));
    }

    @GetMapping
    public ResponseEntity<List<Distributor>> getAllDistributors() {
        return ResponseEntity.ok(distributorService.getAllDistributors());
    }

    @PutMapping("/{id}")
    public ResponseEntity<Distributor> updateDistributor(@PathVariable Long id, @RequestBody Distributor distributor) {
        distributor.setDistributorId(id);
        return ResponseEntity.ok(distributorService.updateDistributor(distributor));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDistributor(@PathVariable Long id) {
        distributorService.deleteDistributor(id);
        return ResponseEntity.ok().build();
    }
}