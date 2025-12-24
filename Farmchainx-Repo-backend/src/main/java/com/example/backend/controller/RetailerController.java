package com.example.backend.controller;

import com.example.backend.entity.Retailer;
import com.example.backend.service.RetailerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/retailer")
public class RetailerController {
    
    @Autowired
    private RetailerService retailerService;

    @PostMapping
    public ResponseEntity<Retailer> createRetailer(@RequestBody Retailer retailer) {
        return ResponseEntity.ok(retailerService.createRetailer(retailer));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Retailer> getRetailer(@PathVariable Long id) {
        return ResponseEntity.ok(retailerService.getRetailerById(id));
    }

    @GetMapping
    public ResponseEntity<List<Retailer>> getAllRetailers() {
        return ResponseEntity.ok(retailerService.getAllRetailers());
    }

    @PutMapping("/{id}")
    public ResponseEntity<Retailer> updateRetailer(@PathVariable Long id, @RequestBody Retailer retailer) {
        retailer.setRetailerId(id);
        return ResponseEntity.ok(retailerService.updateRetailer(retailer));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRetailer(@PathVariable Long id) {
        retailerService.deleteRetailer(id);
        return ResponseEntity.ok().build();
    }
}