package com.logistics.mdm.repository;

import com.logistics.mdm.domain.Branch;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BranchRepository extends JpaRepository<Branch, Long> {
    List<Branch> findByNameContaining(String name);
}
