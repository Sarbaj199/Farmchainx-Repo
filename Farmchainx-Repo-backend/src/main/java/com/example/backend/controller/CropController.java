package com.example.backend.controller;

import com.example.backend.entity.Crop;
import com.example.backend.service.CropService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/crop")
public class CropController {
    
    @Autowired
    private CropService cropService;

    @PostMapping
    public ResponseEntity<Crop> createCrop(@RequestParam Long farmerId,@RequestBody Crop crop) throws Exception {
        return ResponseEntity.ok(cropService.addCrop(farmerId,crop));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Crop> getCrop(@PathVariable Long id) {
        return ResponseEntity.ok(cropService.getCropById(id));
    }

    @GetMapping
    public ResponseEntity<List<Crop>> getAllCrops() {
        return ResponseEntity.ok(cropService.getAllCrops());
    }

    @GetMapping("/farmer/{farmerId}")
    public ResponseEntity<List<Crop>> getCropsByFarmer(@PathVariable Long farmerId) {
        return ResponseEntity.ok(cropService.getCropsByFarmer(farmerId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Crop> updateCrop(@PathVariable Long id, @RequestBody Crop crop) throws Exception{
        crop.setCropId(id);
        return ResponseEntity.ok(cropService.updateCrop(id,crop));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCrop(@PathVariable Long id) {
        cropService.deleteCrop(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{cropId}/qr")
    public ResponseEntity<?> getCropQRCode(@PathVariable Long cropId) {
        try {
            Crop crop = cropService.getCropById(cropId);
            if (crop == null) {
                return ResponseEntity.notFound().build();
            }

            String qrCode = crop.getQrCodeBase64();

            return ResponseEntity.ok(qrCode);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}