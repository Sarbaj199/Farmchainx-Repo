package com.example.backend.repository;

import com.example.backend.entity.Farmer;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface FarmerRepository extends JpaRepository<Farmer, Long> {

    @Query("SELECT f FROM Farmer f WHERE f.user.id = :userId")
    Farmer findByUserId(@Param("userId") Long userId);

    @Query("SELECT f FROM Farmer f WHERE f.user.id = :userId")
    Optional<Farmer> findFarmerByUserId(@Param("userId") Long userId);

    long countByIsVerified(boolean b);

    @Query("SELECT COUNT(f) FROM Farmer f WHERE f.isVerified IS NULL")
    long countByIsVerifiedIsNull();

}