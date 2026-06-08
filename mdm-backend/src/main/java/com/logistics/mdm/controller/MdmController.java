package com.logistics.mdm.controller;

import com.logistics.mdm.domain.*;
import com.logistics.mdm.domain.Mapping;
import com.logistics.mdm.service.MdmService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/mdm")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class MdmController {

    private final MdmService mdmService;

    // Corporation Endpoints
    @GetMapping("/corporations")
    public ResponseEntity<List<Corporation>> getCorporations(@RequestParam(value = "name", required = false) String name) {
        if (name != null && !name.trim().isEmpty()) {
            return ResponseEntity.ok(mdmService.searchCorporations(name));
        }
        return ResponseEntity.ok(mdmService.getAllCorporations());
    }

    @PostMapping("/corporations")
    public ResponseEntity<Corporation> saveCorporation(@RequestBody Corporation corporation) {
        return ResponseEntity.ok(mdmService.saveCorporation(corporation));
    }

    @PutMapping("/corporations/{id}")
    public ResponseEntity<Corporation> updateCorporation(@PathVariable("id") Long id, @RequestBody Corporation corporation) {
        corporation.setId(id);
        return ResponseEntity.ok(mdmService.saveCorporation(corporation));
    }

    @DeleteMapping("/corporations/{id}")
    public ResponseEntity<Void> deleteCorporation(@PathVariable("id") Long id) {
        mdmService.deleteCorporation(id);
        return ResponseEntity.ok().build();
    }

    // Branch Endpoints
    @GetMapping("/branches")
    public ResponseEntity<List<Branch>> getBranches(@RequestParam(value = "name", required = false) String name) {
        if (name != null && !name.trim().isEmpty()) {
            return ResponseEntity.ok(mdmService.searchBranches(name));
        }
        return ResponseEntity.ok(mdmService.getAllBranches());
    }

    @PostMapping("/branches")
    public ResponseEntity<Branch> saveBranch(@RequestBody Branch branch) {
        return ResponseEntity.ok(mdmService.saveBranch(branch));
    }

    @PutMapping("/branches/{id}")
    public ResponseEntity<Branch> updateBranch(@PathVariable("id") Long id, @RequestBody Branch branch) {
        branch.setId(id);
        return ResponseEntity.ok(mdmService.saveBranch(branch));
    }

    @DeleteMapping("/branches/{id}")
    public ResponseEntity<Void> deleteBranch(@PathVariable("id") Long id) {
        mdmService.deleteBranch(id);
        return ResponseEntity.ok().build();
    }

    // Warehouse Endpoints
    @GetMapping("/warehouses")
    public ResponseEntity<List<Warehouse>> getWarehouses(@RequestParam(value = "name", required = false) String name) {
        if (name != null && !name.trim().isEmpty()) {
            return ResponseEntity.ok(mdmService.searchWarehouses(name));
        }
        return ResponseEntity.ok(mdmService.getAllWarehouses());
    }

    @PostMapping("/warehouses")
    public ResponseEntity<Warehouse> saveWarehouse(@RequestBody Warehouse warehouse) {
        return ResponseEntity.ok(mdmService.saveWarehouse(warehouse));
    }

    @PutMapping("/warehouses/{id}")
    public ResponseEntity<Warehouse> updateWarehouse(@PathVariable("id") Long id, @RequestBody Warehouse warehouse) {
        warehouse.setId(id);
        return ResponseEntity.ok(mdmService.saveWarehouse(warehouse));
    }

    @DeleteMapping("/warehouses/{id}")
    public ResponseEntity<Void> deleteWarehouse(@PathVariable("id") Long id) {
        mdmService.deleteWarehouse(id);
        return ResponseEntity.ok().build();
    }

    // Mapping Endpoints
    @GetMapping("/mappings")
    public ResponseEntity<List<Mapping>> getMappings(@RequestParam(value = "userId", required = false) String userId) {
        if (userId != null && !userId.trim().isEmpty()) {
            return ResponseEntity.ok(mdmService.getMappingsByUserId(userId));
        }
        return ResponseEntity.ok(mdmService.getAllMappings());
    }

    @PostMapping("/mappings")
    public ResponseEntity<Mapping> saveMapping(@RequestBody Mapping mapping) {
        return ResponseEntity.ok(mdmService.saveMapping(mapping));
    }

    @PutMapping("/mappings/{id}")
    public ResponseEntity<Mapping> updateMapping(@PathVariable("id") Long id, @RequestBody Mapping mapping) {
        mapping.setId(id);
        return ResponseEntity.ok(mdmService.saveMapping(mapping));
    }

    @DeleteMapping("/mappings/{id}")
    public ResponseEntity<Void> deleteMapping(@PathVariable("id") Long id) {
        mdmService.deleteMapping(id);
        return ResponseEntity.ok().build();
    }

    // Customer Endpoints
    @GetMapping("/customers")
    public ResponseEntity<List<Customer>> getCustomers(@RequestParam(value = "name", required = false) String name) {
        if (name != null && !name.trim().isEmpty()) {
            return ResponseEntity.ok(mdmService.searchCustomers(name));
        }
        return ResponseEntity.ok(mdmService.getAllCustomers());
    }

    @PostMapping("/customers")
    public ResponseEntity<Customer> saveCustomer(@RequestBody Customer customer) {
        return ResponseEntity.ok(mdmService.saveCustomer(customer));
    }

    @PutMapping("/customers/{id}")
    public ResponseEntity<Customer> updateCustomer(@PathVariable("id") Long id, @RequestBody Customer customer) {
        customer.setId(id);
        return ResponseEntity.ok(mdmService.saveCustomer(customer));
    }

    @DeleteMapping("/customers/{id}")
    public ResponseEntity<Void> deleteCustomer(@PathVariable("id") Long id) {
        mdmService.deleteCustomer(id);
        return ResponseEntity.ok().build();
    }

    // Partner Endpoints
    @GetMapping("/partners")
    public ResponseEntity<List<Partner>> getPartners(@RequestParam(value = "name", required = false) String name) {
        if (name != null && !name.trim().isEmpty()) {
            return ResponseEntity.ok(mdmService.searchPartners(name));
        }
        return ResponseEntity.ok(mdmService.getAllPartners());
    }

    @PostMapping("/partners")
    public ResponseEntity<Partner> savePartner(@RequestBody Partner partner) {
        return ResponseEntity.ok(mdmService.savePartner(partner));
    }

    @PutMapping("/partners/{id}")
    public ResponseEntity<Partner> updatePartner(@PathVariable("id") Long id, @RequestBody Partner partner) {
        partner.setId(id);
        return ResponseEntity.ok(mdmService.savePartner(partner));
    }

    @DeleteMapping("/partners/{id}")
    public ResponseEntity<Void> deletePartner(@PathVariable("id") Long id) {
        mdmService.deletePartner(id);
        return ResponseEntity.ok().build();
    }
}
