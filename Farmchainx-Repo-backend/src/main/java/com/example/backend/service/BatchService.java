package com.example.backend.service;

import com.example.backend.entity.Batch;
import com.example.backend.entity.Crop;
import com.example.backend.entity.Farmer;
import com.example.backend.entity.User;
import com.example.backend.exception.ResourceNotFoundException;
import com.example.backend.repository.BatchRepository;
import com.example.backend.repository.CropRepository;
import com.example.backend.repository.FarmerRepository;
import com.example.backend.repository.UserRepository;
import com.example.backend.utils.QRCodeGenerator;
import com.google.zxing.WriterException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.List;

@Service
public class BatchService {

    @Autowired
    private BatchRepository batchRepository;

    @Autowired
    private CropRepository cropRepository;

    @Autowired
    private FarmerRepository farmerRepository;

    @Autowired
    private UserRepository userRepository;

    // ✅ KEEP EXISTING: Create batch for farmer (backward compatibility)
    public Batch createBatch(Long farmerId, Long cropId, Batch batch) {
        Farmer farmer = farmerRepository.findById(farmerId)
                .orElseThrow(() -> new ResourceNotFoundException("Farmer not found with ID: " + farmerId));

        Crop crop = cropRepository.findById(cropId)
                .orElseThrow(() -> new ResourceNotFoundException("Crop not found with ID: " + cropId));

        if (!crop.getFarmer().getFarmerId().equals(farmerId)) {
            throw new IllegalArgumentException("Crop does not belong to this farmer.");
        }

        // batch.setFarmer(farmer);
        batch.setUser(farmer.getUser()); // Set user from farmer
        batch.setCrop(crop);
        batch.setCreatedByRole(Batch.BatchCreatorRole.FARMER);
        
        setBatchDefaults(batch);

        Batch savedBatch = batchRepository.save(batch);
        generateQRCode(savedBatch);
        return savedBatch;
    }

    // ✅ ADD: Create batch for any role (Farmer, Distributor, Retailer)
    public Batch createBatchForRole(Long userId, Long cropId, Batch batch, Batch.BatchCreatorRole creatorRole) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        Crop crop = cropRepository.findById(cropId)
                .orElseThrow(() -> new ResourceNotFoundException("Crop not found with ID: " + cropId));

        // Validate crop ownership based on role
        validateCropAccess(userId, cropId, creatorRole);

        batch.setUser(user);
        batch.setCrop(crop);
        batch.setCreatedByRole(creatorRole);
        
        setBatchDefaults(batch);

        // Generate batch number if not provided
        if (batch.getBatchNumber() == null) {
            batch.setBatchNumber(generateBatchNumber(creatorRole));
        }

        Batch savedBatch = batchRepository.save(batch);
        generateQRCode(savedBatch);
        return savedBatch;
    }

    // ✅ ADD: Validate crop access based on role
    private void validateCropAccess(Long userId, Long cropId, Batch.BatchCreatorRole creatorRole) {
        Crop crop = cropRepository.findById(cropId)
                .orElseThrow(() -> new ResourceNotFoundException("Crop not found with ID: " + cropId));

        switch (creatorRole) {
            case FARMER:
                // Farmer can only create batches from their own crops
                if (!crop.getFarmer().getUser().getId().equals(userId)) {
                    throw new IllegalArgumentException("Farmers can only create batches from their own crops.");
                }
                break;
            case DISTRIBUTOR:
                // Distributors can create batches from any crop they have purchased
                // You might want to add additional validation here
                break;
            case RETAILER:
                // Retailers can create batches from any crop they have purchased
                // You might want to add additional validation here
                break;
        }
    }

    // ✅ ADD: Set batch defaults
    private void setBatchDefaults(Batch batch) {
        if (batch.getStatus() == null) {
            batch.setStatus(Batch.BatchStatus.AVAILABLE);
        }
        if (batch.getAvailableQuantity() == null && batch.getQuantity() != null) {
            batch.setAvailableQuantity(batch.getQuantity());
        }
        if (batch.getPricePerUnit() == null && batch.getPrice() != null && batch.getQuantity() != null && batch.getQuantity() > 0) {
            batch.setPricePerUnit(batch.getPrice() / batch.getQuantity());
        }
    }

    // ✅ ADD: Generate batch number based on role
    private String generateBatchNumber(Batch.BatchCreatorRole creatorRole) {
        String prefix;
        switch (creatorRole) {
            case FARMER:
                prefix = "FARM-BATCH";
                break;
            case DISTRIBUTOR:
                prefix = "DIST-BATCH";
                break;
            case RETAILER:
                prefix = "RET-BATCH";
                break;
            default:
                prefix = "BATCH";
        }
        return prefix + "-" + System.currentTimeMillis();
    }

    // ✅ ADD: Get batches by user
    public List<Batch> getBatchesByUser(Long userId) {
        return batchRepository.findByUserId(userId);
    }

    // ✅ ADD: Get batches by user and role
    public List<Batch> getBatchesByUserAndRole(Long userId, Batch.BatchCreatorRole role) {
        return batchRepository.findByUserUserIdAndCreatedByRole(userId, role);
    }

    // ✅ ADD: Get batches by creator role
    public List<Batch> getBatchesByCreatorRole(Batch.BatchCreatorRole role) {
        return batchRepository.findByCreatedByRole(role);
    }

    // ✅ ADD: Get available batches by creator role
    public List<Batch> getAvailableBatchesByRole(Batch.BatchCreatorRole role) {
        return batchRepository.findByStatusAndCreatedByRole(Batch.BatchStatus.AVAILABLE, role);
    }

    // ✅ ADD: Get available farmer batches (for distributors)
    public List<Batch> getAvailableFarmerBatches() {
        return getAvailableBatchesByRole(Batch.BatchCreatorRole.FARMER);
    }

    // ✅ ADD: Get available distributor batches (for retailers)
    public List<Batch> getAvailableDistributorBatches() {
        return getAvailableBatchesByRole(Batch.BatchCreatorRole.DISTRIBUTOR);
    }

    // ✅ ADD: Get available retailer batches (for customers)
    public List<Batch> getAvailableRetailerBatches() {
        return getAvailableBatchesByRole(Batch.BatchCreatorRole.RETAILER);
    }

    // ✅ UPDATE: Get Available Batches with role filtering
    public List<Batch> getAvailableBatches() {
        return batchRepository.findAvailableBatches();
    }

    public List<Batch> getAvailableBatches(Batch.BatchCreatorRole role) {
        if (role != null) {
            return getAvailableBatchesByRole(role);
        }
        return getAvailableBatches();
    }

    // ✅ KEEP ALL EXISTING METHODS (update them to handle new fields)
    public Batch getBatchById(Long batchId) {
        return batchRepository.findById(batchId)
                .orElseThrow(() -> new ResourceNotFoundException("Batch not found with ID: " + batchId));
    }

    public List<Batch> getAllBatches() {
        return batchRepository.findAll();
    }

    public List<Batch> getBatchesByCrop(Long cropId) {
        return batchRepository.findByCrop_CropId(cropId);
    }

    // public List<Batch> getBatchesByFarmer(Long farmerId) {
    //     return batchRepository.findByFarmer_FarmerId(farmerId);
    // }

    public Batch updateBatch(Long batchId, Batch updatedBatch) {
        Batch existingBatch = getBatchById(batchId);

        if (updatedBatch.getBatchNumber() != null) {
            existingBatch.setBatchNumber(updatedBatch.getBatchNumber());
        }
        if (updatedBatch.getHarvestDate() != null) {
            existingBatch.setHarvestDate(updatedBatch.getHarvestDate());
        }
        if (updatedBatch.getQuantity() != null) {
            existingBatch.setQuantity(updatedBatch.getQuantity());
        }
        if (updatedBatch.getUnit() != null) {
            existingBatch.setUnit(updatedBatch.getUnit());
        }
        if (updatedBatch.getStorageConditions() != null) {
            existingBatch.setStorageConditions(updatedBatch.getStorageConditions());
        }
        if (updatedBatch.getPrice() != null) {
            existingBatch.setPrice(updatedBatch.getPrice());
        }
        if (updatedBatch.getPricePerUnit() != null) {
            existingBatch.setPricePerUnit(updatedBatch.getPricePerUnit());
        }
        if (updatedBatch.getStatus() != null) {
            existingBatch.setStatus(updatedBatch.getStatus());
        }
        if (updatedBatch.getAvailableQuantity() != null) {
            existingBatch.setAvailableQuantity(updatedBatch.getAvailableQuantity());
        }

        return batchRepository.save(existingBatch);
    }

    public void deleteBatch(Long batchId) {
        Batch batch = getBatchById(batchId);
        batchRepository.delete(batch);
    }

    public Batch updateBatchStatus(Long batchId, Batch.BatchStatus status) {
        Batch batch = getBatchById(batchId);
        batch.setStatus(status);
        return batchRepository.save(batch);
    }

    public Batch updateBatchQuantity(Long batchId, Double newAvailableQuantity) {
        Batch batch = getBatchById(batchId);
        
        if (newAvailableQuantity < 0) {
            throw new IllegalArgumentException("Available quantity cannot be negative");
        }
        if (newAvailableQuantity > batch.getQuantity()) {
            throw new IllegalArgumentException("Available quantity cannot exceed total quantity");
        }
        
        batch.setAvailableQuantity(newAvailableQuantity);
        
        // Auto-update status based on available quantity
        if (newAvailableQuantity == 0) {
            batch.setStatus(Batch.BatchStatus.SOLD);
        } else if (newAvailableQuantity < batch.getQuantity()) {
            batch.setStatus(Batch.BatchStatus.RESERVED);
        } else {
            batch.setStatus(Batch.BatchStatus.AVAILABLE);
        }
        
        return batchRepository.save(batch);
    }

    public List<Batch> getBatchesByStatus(Batch.BatchStatus status) {
        return batchRepository.findByStatus(status);
    }

    public Batch reduceAvailableQuantity(Long batchId, Double quantityToReduce) {
        Batch batch = getBatchById(batchId);
        
        if (batch.getAvailableQuantity() < quantityToReduce) {
            throw new IllegalArgumentException("Insufficient available quantity. Available: " + batch.getAvailableQuantity());
        }
        
        double newAvailableQuantity = batch.getAvailableQuantity() - quantityToReduce;
        return updateBatchQuantity(batchId, newAvailableQuantity);
    }

    private void generateQRCode(Batch batch) {
        String qrData = "{"
                + "\"batchId\": " + batch.getBatchId() + ","
                + "\"batchNumber\": \"" + batch.getBatchNumber() + "\","
                + "\"harvestDate\": \"" + batch.getHarvestDate() + "\","
                + "\"quantity\": " + batch.getQuantity() + ","
                + "\"availableQuantity\": " + batch.getAvailableQuantity() + ","
                + "\"unit\": \"" + batch.getUnit() + "\","
                + "\"storageConditions\": \"" + batch.getStorageConditions() + "\","
                + "\"price\": " + batch.getPrice() + ","
                + "\"pricePerUnit\": " + batch.getPricePerUnit() + ","
                + "\"status\": \"" + batch.getStatus() + "\","
                + "\"createdByRole\": \"" + batch.getCreatedByRole() + "\","
                + "\"crop\": \"" + batch.getCrop().getName() + "\","
                + "\"creator\": \"" + batch.getUser().getName() + "\""
                + "}";

        try {
            String base64QR = QRCodeGenerator.generateQRCode(qrData, 300, 300);
            batch.setQrCode(base64QR);
            batchRepository.save(batch);
        } catch (WriterException | IOException e) {
            throw new RuntimeException("Failed to generate QR code: " + e.getMessage());
        }
    }

    public Batch regenerateQRCode(Long batchId) {
        Batch batch = getBatchById(batchId);
        generateQRCode(batch);
        return batch;
    }


   
}