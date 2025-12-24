// 


package com.example.backend.repository;

import com.example.backend.entity.Batch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BatchRepository extends JpaRepository<Batch, Long> {
    
    // 1. Find batches by crop ID
    @Query("SELECT b FROM Batch b WHERE b.crop.cropId = :cropId")
    List<Batch> findByCrop_CropId(@Param("cropId") Long cropId);
    
    // 2. Find available batches
    @Query("SELECT b FROM Batch b WHERE b.status = 'AVAILABLE'")
    List<Batch> findAvailableBatches();
    
    // 3. Find batches by status
    @Query("SELECT b FROM Batch b WHERE b.status = :status")
    List<Batch> findByStatus(@Param("status") Batch.BatchStatus status);
    
    // 4. Find batches by user ID
    @Query("SELECT b FROM Batch b WHERE b.user.id = :userId")
    List<Batch> findByUserId(@Param("userId") Long userId);
    
    // 5. Find batches by user ID and created by role
    @Query("SELECT b FROM Batch b WHERE b.user.id = :userId AND b.createdByRole = :role")
    List<Batch> findByUserUserIdAndCreatedByRole(@Param("userId") Long userId, @Param("role") Batch.BatchCreatorRole role);
    
    // 6. Find batches by created by role
    @Query("SELECT b FROM Batch b WHERE b.createdByRole = :role")
    List<Batch> findByCreatedByRole(@Param("role") Batch.BatchCreatorRole role);
    
    // 7. Find batches by status and created by role
    @Query("SELECT b FROM Batch b WHERE b.status = :status AND b.createdByRole = :role")
    List<Batch> findByStatusAndCreatedByRole(@Param("status") Batch.BatchStatus status, @Param("role") Batch.BatchCreatorRole role);
    
    // 8. Find batches by multiple roles
    @Query("SELECT b FROM Batch b WHERE b.createdByRole IN :roles")
    List<Batch> findByCreatedByRoleIn(@Param("roles") List<Batch.BatchCreatorRole> roles);
    
    // 9. Find available batches for specific roles
    @Query("SELECT b FROM Batch b WHERE b.status = 'AVAILABLE' AND b.createdByRole IN :roles")
    List<Batch> findAvailableBatchesByRoles(@Param("roles") List<Batch.BatchCreatorRole> roles);
}