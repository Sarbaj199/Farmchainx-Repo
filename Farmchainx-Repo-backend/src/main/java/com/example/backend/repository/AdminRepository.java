package com.example.backend.repository;

import com.example.backend.entity.Admin;
import com.example.backend.entity.Role;
import com.example.backend.entity.User;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AdminRepository extends JpaRepository<Admin, Long> {
    

}