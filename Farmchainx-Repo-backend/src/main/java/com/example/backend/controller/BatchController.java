package com.example.backend.controller;

import com.example.backend.entity.Batch;
import com.example.backend.service.BatchService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/batches")
public class BatchController {

    @Autowired
    private BatchService batchService;

    // ✅ Create Batch for Farmer (existing - backward compatibility)
    @PostMapping("/farmer/{farmerId}/crop/{cropId}")
    public ResponseEntity<Batch> createBatch(
            @PathVariable Long farmerId,
            @PathVariable Long cropId,
            @RequestBody Batch batch) {

        Batch savedBatch = batchService.createBatch(farmerId, cropId, batch);
        return ResponseEntity.ok(savedBatch);
    }

    // ✅ CREATE: Create Batch for any role (Farmer, Distributor, Retailer)
    @PostMapping("/user/{userId}/crop/{cropId}/role/{role}")
    public ResponseEntity<Batch> createBatchForRole(
            @PathVariable Long userId,
            @PathVariable Long cropId,
            @PathVariable Batch.BatchCreatorRole role,
            @RequestBody Batch batch) {

        Batch savedBatch = batchService.createBatchForRole(userId, cropId, batch, role);
        return ResponseEntity.ok(savedBatch);
    }

    // ✅ CREATE: Quick endpoints for specific roles
    @PostMapping("/distributor/{userId}/crop/{cropId}")
    public ResponseEntity<Batch> createDistributorBatch(
            @PathVariable Long userId,
            @PathVariable Long cropId,
            @RequestBody Batch batch) {

        Batch savedBatch = batchService.createBatchForRole(userId, cropId, batch, Batch.BatchCreatorRole.DISTRIBUTOR);
        return ResponseEntity.ok(savedBatch);
    }

    @PostMapping("/retailer/{userId}/crop/{cropId}")
    public ResponseEntity<Batch> createRetailerBatch(
            @PathVariable Long userId,
            @PathVariable Long cropId,
            @RequestBody Batch batch) {

        Batch savedBatch = batchService.createBatchForRole(userId, cropId, batch, Batch.BatchCreatorRole.RETAILER);
        return ResponseEntity.ok(savedBatch);
    }

    // ✅ READ: Get Batch by ID
    @GetMapping("/{id}")
    public ResponseEntity<Batch> getBatch(@PathVariable Long id) {
        return ResponseEntity.ok(batchService.getBatchById(id));
    }

    // ✅ READ: Get All Batches
    @GetMapping
    public ResponseEntity<List<Batch>> getAllBatches() {
        return ResponseEntity.ok(batchService.getAllBatches());
    }

    // ✅ READ: Get Batches by User (replaces farmer-specific endpoint)
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Batch>> getBatchesByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(batchService.getBatchesByUser(userId));
    }

    // ✅ READ: Get Batches by User and Role
    @GetMapping("/user/{userId}/role/{role}")
    public ResponseEntity<List<Batch>> getBatchesByUserAndRole(
            @PathVariable Long userId,
            @PathVariable Batch.BatchCreatorRole role) {
        return ResponseEntity.ok(batchService.getBatchesByUserAndRole(userId, role));
    }

    // ✅ READ: Get Batches by Creator Role
    @GetMapping("/creator-role/{role}")
    public ResponseEntity<List<Batch>> getBatchesByCreatorRole(@PathVariable Batch.BatchCreatorRole role) {
        return ResponseEntity.ok(batchService.getBatchesByCreatorRole(role));
    }

    // ✅ READ: Get Batches by Crop
    @GetMapping("/crop/{cropId}")
    public ResponseEntity<List<Batch>> getBatchesByCrop(@PathVariable Long cropId) {
        return ResponseEntity.ok(batchService.getBatchesByCrop(cropId));
    }

    // ✅ READ: Get Batches by Farmer (existing - backward compatibility)
    // @GetMapping("/farmer/{farmerId}")
    // public ResponseEntity<List<Batch>> getBatchesByFarmer(@PathVariable Long farmerId) {
    //     return ResponseEntity.ok(batchService.getBatchesByFarmer(farmerId));
    // }

    // ✅ READ: Get Available Batches (all roles)
    @GetMapping("/available")
    public ResponseEntity<List<Batch>> getAvailableBatches() {
        List<Batch> batches = batchService.getAvailableBatches();
        return ResponseEntity.ok(batches);
    }

    // ✅ READ: Get Available Batches by Specific Role
    @GetMapping("/available/role/{role}")
    public ResponseEntity<List<Batch>> getAvailableBatchesByRole(@PathVariable Batch.BatchCreatorRole role) {
        List<Batch> batches = batchService.getAvailableBatchesByRole(role);
        return ResponseEntity.ok(batches);
    }

    // ✅ READ: Get Available Farmer Batches (for distributors)
    @GetMapping("/available/farmers")
    public ResponseEntity<List<Batch>> getAvailableFarmerBatches() {
        List<Batch> batches = batchService.getAvailableFarmerBatches();
        return ResponseEntity.ok(batches);
    }

    // ✅ READ: Get Available Distributor Batches (for retailers)
    @GetMapping("/available/distributors")
    public ResponseEntity<List<Batch>> getAvailableDistributorBatches() {
        List<Batch> batches = batchService.getAvailableDistributorBatches();
        return ResponseEntity.ok(batches);
    }

    // ✅ READ: Get Available Retailer Batches (for customers)
    @GetMapping("/available/retailers")
    public ResponseEntity<List<Batch>> getAvailableRetailerBatches() {
        List<Batch> batches = batchService.getAvailableRetailerBatches();
        return ResponseEntity.ok(batches);
    }

    // ✅ READ: Get Batches by Status
    @GetMapping("/status/{status}")
    public ResponseEntity<List<Batch>> getBatchesByStatus(@PathVariable Batch.BatchStatus status) {
        List<Batch> batches = batchService.getBatchesByStatus(status);
        return ResponseEntity.ok(batches);
    }

    // ✅ UPDATE: Update Batch
    @PutMapping("/{id}")
    public ResponseEntity<Batch> updateBatch(
            @PathVariable Long id,
            @RequestBody Batch batch) {
        Batch updatedBatch = batchService.updateBatch(id, batch);
        return ResponseEntity.ok(updatedBatch);
    }

    // ✅ UPDATE: Update Batch Status
    @PutMapping("/{batchId}/status")
    public ResponseEntity<Batch> updateBatchStatus(@PathVariable Long batchId, 
                                                   @RequestBody BatchStatusUpdate request) {
        Batch batch = batchService.updateBatchStatus(batchId, request.getStatus());
        return ResponseEntity.ok(batch);
    }

    // ✅ UPDATE: Update Batch Quantity
    @PutMapping("/{batchId}/quantity")
    public ResponseEntity<Batch> updateBatchQuantity(@PathVariable Long batchId,
                                                     @RequestBody QuantityUpdate request) {
        Batch batch = batchService.updateBatchQuantity(batchId, request.getAvailableQuantity());
        return ResponseEntity.ok(batch);
    }

    // ✅ UPDATE: Reduce Available Quantity (for transactions)
    @PutMapping("/{batchId}/reduce-quantity")
    public ResponseEntity<Batch> reduceBatchQuantity(@PathVariable Long batchId,
                                                     @RequestBody ReduceQuantityRequest request) {
        Batch batch = batchService.reduceAvailableQuantity(batchId, request.getQuantity());
        return ResponseEntity.ok(batch);
    }

    // ✅ DELETE: Delete Batch
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBatch(@PathVariable Long id) {
        batchService.deleteBatch(id);
        return ResponseEntity.ok().build();
    }

    // ✅ UTILITY: Regenerate QR Code
    @PostMapping("/{batchId}/regenerate-qr")
    public ResponseEntity<Batch> regenerateQRCode(@PathVariable Long batchId) {
        Batch batch = batchService.regenerateQRCode(batchId);
        return ResponseEntity.ok(batch);
    }

    // Request DTOs
    public static class BatchStatusUpdate {
        private Batch.BatchStatus status;
        
        public Batch.BatchStatus getStatus() { return status; }
        public void setStatus(Batch.BatchStatus status) { this.status = status; }
    }

    public static class QuantityUpdate {
        private Double availableQuantity;
        
        public Double getAvailableQuantity() { return availableQuantity; }
        public void setAvailableQuantity(Double availableQuantity) { this.availableQuantity = availableQuantity; }
    }

    public static class ReduceQuantityRequest {
        private Double quantity;
        
        public Double getQuantity() { return quantity; }
        public void setQuantity(Double quantity) { this.quantity = quantity; }
    }

    // ✅ ADD: Request DTO for batch creation with role
    public static class BatchCreateRequest {
        private Batch batch;
        private Batch.BatchCreatorRole createdByRole;
        
        public Batch getBatch() { return batch; }
        public void setBatch(Batch batch) { this.batch = batch; }
        
        public Batch.BatchCreatorRole getCreatedByRole() { return createdByRole; }
        public void setCreatedByRole(Batch.BatchCreatorRole createdByRole) { this.createdByRole = createdByRole; }
    }
}