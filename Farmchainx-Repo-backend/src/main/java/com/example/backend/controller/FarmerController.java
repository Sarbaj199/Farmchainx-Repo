package com.example.backend.controller;

import com.example.backend.entity.Farmer;
import com.example.backend.service.FarmerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/farmer")
public class FarmerController {
    
    @Autowired
    private FarmerService farmerService;

    @PostMapping
    public ResponseEntity<Farmer> createFarmer(@RequestBody Farmer farmer) {
        return ResponseEntity.ok(farmerService.createFarmer(farmer));
    }

    
    @GetMapping("/{id}")
    public ResponseEntity<Farmer> getFarmer(@PathVariable Long id) {
        return ResponseEntity.ok(farmerService.getFarmerById(id));
    }

    @GetMapping
    public ResponseEntity<List<Farmer>> getAllFarmers() {
        return ResponseEntity.ok(farmerService.getAllFarmers());
    }

    @PutMapping("/{id}")
    public ResponseEntity<Farmer> updateFarmer(@PathVariable Long id, @RequestBody Farmer farmer) {
        farmer.setFarmerId(id);
        return ResponseEntity.ok(farmerService.updateFarmer(farmer));
    }

    @GetMapping("/user/{farmerId}")
public ResponseEntity<?> getUserByFarmerId(@PathVariable Long farmerId) {
    return ResponseEntity.ok(farmerService.getUserByFarmerId(farmerId));
}

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFarmer(@PathVariable Long id) {
        farmerService.deleteFarmer(id);
        return ResponseEntity.ok().build();
    }
}