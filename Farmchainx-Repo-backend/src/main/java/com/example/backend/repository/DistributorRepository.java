package com.example.backend.repository;

import com.example.backend.entity.Distributor;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface DistributorRepository extends JpaRepository<Distributor, Long> {

    @Query("SELECT d FROM Distributor d WHERE d.user.id = :userId")
    Distributor findByUserId(@Param("userId") Long userId);

    @Query("SELECT d FROM Distributor d WHERE d.user.id = :userId")
    Optional<Distributor> findDistributorByUserId(@Param("userId") Long userId);

    long countByIsVerified(boolean b);

    @Query("SELECT COUNT(d) FROM Distributor d WHERE d.isVerified IS NULL")
    long countByIsVerifiedIsNull();

}