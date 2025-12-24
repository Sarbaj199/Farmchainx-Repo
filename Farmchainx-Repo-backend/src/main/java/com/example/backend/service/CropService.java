package com.example.backend.service;

import com.example.backend.entity.Crop;
import com.example.backend.entity.Farmer;
import com.example.backend.repository.CropRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.List;

@Service
public class CropService {

    @Autowired
    private CropRepository cropRepository;

    @Autowired
    private FarmerService farmerService;

    // ✅ Add Crop for a Farmer
    public Crop addCrop(Long farmerId, Crop crop) throws Exception {

        // 1️⃣ Get farmer
        Farmer farmer = farmerService.getFarmerById(farmerId);

        // 2️⃣ Set farmer reference
        crop.setFarmer(farmer);

        // 3️⃣ Save temporarily to get cropId
        Crop savedCrop = cropRepository.save(crop);
         try {
            String qrData = "{"
                    + "\"cropId\": " + savedCrop.getCropId() + ","
                    + "\"name\": \"" + savedCrop.getName() + "\","
                    + "\"variety\": \"" + savedCrop.getVariety() + "\","
                    + "\"season\": \"" + savedCrop.getSeason() + "\","
                    + "\"growingPeriod\": \"" + savedCrop.getGrowingPeriod() + "\","
                    + "\"description\": \"" + (savedCrop.getDescription() != null ? savedCrop.getDescription() : "") + "\","
                    + "\"pricePerKg\": " + savedCrop.getPricePerKg() + ","
                    + "\"quantityAvailable\": " + savedCrop.getQuantityAvailable() + ","
                    + "\"harvestDate\": \"" + savedCrop.getHarvestDate() + "\","
                    + "\"imageUrl\": \"" + (savedCrop.getImageUrl() != null ? "image_present" : "no_image") + "\"," // Don't put full base64 in QR
                    // + "\"imageUrl\": \"" + (savedCrop.getImageUrl() != null ? 
                    //     savedCrop.getImageUrl().substring(0, Math.min(500, savedCrop.getImageUrl().length())) : "") + "\"," // Don't put full base64 in QR
                    + "\"farmerId\": " + farmer.getFarmerId()
                    + "}";

            String qrBase64 = com.example.backend.utils.QRCodeGenerator.generateQRCode(qrData, 250, 250);
            savedCrop.setQrCodeBase64(qrBase64);

            // 5️⃣ Save crop again with QR
            // savedCrop = cropRepository.save(savedCrop);
            System.out.println("QR code generated and saved for crop ID: " + savedCrop.getCropId());
            
        } catch (Exception qrError) {
            System.err.println("QR generation failed, but crop is saved: " + qrError.getMessage());
            // Continue without QR code - crop is already saved
        }
        
        // savedCrop.setQrCodeBase64(qrBase64);

        // 5️⃣ Save crop again with QR
        savedCrop = cropRepository.save(savedCrop);

        // 6️⃣ Ensure farmer crop list is not null
        List<Crop> farmerCrops = farmer.getCrops();
        if (farmerCrops == null) {
            farmerCrops = new ArrayList<>();
        }
        farmerCrops.add(savedCrop);
        farmer.setCrops(farmerCrops);

        // 7️⃣ Save farmer again to maintain consistency
        farmerService.updateFarmer(farmer);

        return savedCrop;
    }

    // ✅ Get Crops by Farmer
    public List<Crop> getCropsByFarmer(Long farmerId) {
        return cropRepository.findByFarmerFarmerId(farmerId);
    }

    // ✅ Get All Crops
    public List<Crop> getAllCrops() {
        return cropRepository.findAll();
    }

    // ✅ Update Crop (with harvestDate support)
    public Crop updateCrop(Long cropId, Crop updatedCrop) throws Exception {

        // 1️⃣ Fetch existing crop
        Crop existingCrop = cropRepository.findById(cropId)
                .orElseThrow(() -> new RuntimeException("Crop not found with ID: " + cropId));

        // 2️⃣ Update fields
        existingCrop.setName(updatedCrop.getName());
        existingCrop.setVariety(updatedCrop.getVariety());
        existingCrop.setSeason(updatedCrop.getSeason());
        existingCrop.setGrowingPeriod(updatedCrop.getGrowingPeriod());
        existingCrop.setImageUrl(updatedCrop.getImageUrl());
        existingCrop.setDescription(updatedCrop.getDescription());
        existingCrop.setPricePerKg(updatedCrop.getPricePerKg());
        existingCrop.setQuantityAvailable(updatedCrop.getQuantityAvailable());
        existingCrop.setHarvestDate(updatedCrop.getHarvestDate());  // ✅ NEW

        // 3️⃣ Re-generate QR with updated info
        Farmer farmer = existingCrop.getFarmer();

        String qrData = "{"
                + "\"cropId\": " + existingCrop.getCropId() + ","
                + "\"name\": \"" + existingCrop.getName() + "\","
                + "\"variety\": \"" + existingCrop.getVariety() + "\","
                + "\"season\": \"" + existingCrop.getSeason() + "\","
                + "\"growingPeriod\": \"" + existingCrop.getGrowingPeriod() + "\","
                + "\"description\": \"" + existingCrop.getDescription() + "\","
                + "\"pricePerKg\": " + existingCrop.getPricePerKg() + ","
                + "\"quantityAvailable\": " + existingCrop.getQuantityAvailable() + ","
                + "\"harvestDate\": \"" + existingCrop.getHarvestDate() + "\","
                + "\"imageUrl\": \"" + existingCrop.getImageUrl() + "\","
                + "\"farmerId\": " + farmer.getFarmerId()
                + "}";

        String qrBase64 = com.example.backend.utils.QRCodeGenerator.generateQRCode(qrData, 250, 250);
        existingCrop.setQrCodeBase64(qrBase64);

        // 4️⃣ Save and return updated crop
        return cropRepository.save(existingCrop);
    }

    // ✅ Get Crop by ID
    public Crop getCropById(Long id) {
        return cropRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Crop not found"));
    }

    // ✅ Delete Crop (optional helper)
    public void deleteCrop(Long id) {
        cropRepository.deleteById(id);
    }

    
}
