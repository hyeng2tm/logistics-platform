package com.logistics.mdm.service;

import com.logistics.mdm.domain.*;
import com.logistics.mdm.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MdmService {

    private final CorporationRepository corporationRepository;
    private final BranchRepository branchRepository;
    private final WarehouseRepository warehouseRepository;
    private final MappingRepository mappingRepository;
    private final CustomerRepository customerRepository;
    private final PartnerRepository partnerRepository;

    // Corporation CRUD
    public List<Corporation> getAllCorporations() {
        return corporationRepository.findAll();
    }

    public List<Corporation> searchCorporations(String name) {
        return corporationRepository.findByNameContaining(name);
    }

    @Transactional
    public Corporation saveCorporation(@NonNull Corporation corporation) {
        return corporationRepository.save(corporation);
    }

    @Transactional
    public void deleteCorporation(@NonNull Long id) {
        corporationRepository.deleteById(id);
    }

    // Branch CRUD
    public List<Branch> getAllBranches() {
        return branchRepository.findAll();
    }

    public List<Branch> searchBranches(String name) {
        return branchRepository.findByNameContaining(name);
    }

    @Transactional
    public Branch saveBranch(@NonNull Branch branch) {
        return branchRepository.save(branch);
    }

    @Transactional
    public void deleteBranch(@NonNull Long id) {
        branchRepository.deleteById(id);
    }

    // Warehouse CRUD
    public List<Warehouse> getAllWarehouses() {
        return warehouseRepository.findAll();
    }

    public List<Warehouse> searchWarehouses(String name) {
        return warehouseRepository.findByNameContaining(name);
    }

    @Transactional
    public Warehouse saveWarehouse(@NonNull Warehouse warehouse) {
        return warehouseRepository.save(warehouse);
    }

    @Transactional
    public void deleteWarehouse(@NonNull Long id) {
        warehouseRepository.deleteById(id);
    }

    // Mapping CRUD
    public List<Mapping> getAllMappings() {
        return mappingRepository.findAll();
    }

    public List<Mapping> getMappingsByUserId(String userId) {
        return mappingRepository.findByUserId(userId);
    }

    @Transactional
    public Mapping saveMapping(@NonNull Mapping mapping) {
        return mappingRepository.save(mapping);
    }

    @Transactional
    public void deleteMapping(@NonNull Long id) {
        mappingRepository.deleteById(id);
    }

    // Customer CRUD
    public List<Customer> getAllCustomers() {
        return customerRepository.findAll();
    }

    public List<Customer> searchCustomers(String name) {
        return customerRepository.findByNameContaining(name);
    }

    @Transactional
    public Customer saveCustomer(@NonNull Customer customer) {
        return customerRepository.save(customer);
    }

    @Transactional
    public void deleteCustomer(@NonNull Long id) {
        customerRepository.deleteById(id);
    }

    // Partner CRUD
    public List<Partner> getAllPartners() {
        return partnerRepository.findAll();
    }

    public List<Partner> searchPartners(String name) {
        return partnerRepository.findByNameContaining(name);
    }

    @Transactional
    public Partner savePartner(@NonNull Partner partner) {
        return partnerRepository.save(partner);
    }

    @Transactional
    public void deletePartner(@NonNull Long id) {
        partnerRepository.deleteById(id);
    }
}
