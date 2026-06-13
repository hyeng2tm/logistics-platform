package com.logistics.wms.service;

import com.logistics.wms.dto.MdmDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class MdmServiceClient {

    @Value("${app.mdm-service.url:http://mdm-backend:8082}")
    private String mdmServiceUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    public List<MdmDto.Warehouse> getWarehouses() {
        try {
            String url = mdmServiceUrl + "/api/v1/mdm/warehouses";
            ResponseEntity<List<MdmDto.Warehouse>> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<List<MdmDto.Warehouse>>() {}
            );
            return response.getBody() != null ? response.getBody() : Collections.emptyList();
        } catch (Exception e) {
            log.error("Failed to fetch warehouses from MDM service", e);
            return Collections.emptyList();
        }
    }

    public List<MdmDto.Customer> getCustomers() {
        try {
            String url = mdmServiceUrl + "/api/v1/mdm/customers";
            ResponseEntity<List<MdmDto.Customer>> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<List<MdmDto.Customer>>() {}
            );
            return response.getBody() != null ? response.getBody() : Collections.emptyList();
        } catch (Exception e) {
            log.error("Failed to fetch customers from MDM service", e);
            return Collections.emptyList();
        }
    }

    public List<MdmDto.Partner> getPartners() {
        try {
            String url = mdmServiceUrl + "/api/v1/mdm/partners";
            ResponseEntity<List<MdmDto.Partner>> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<List<MdmDto.Partner>>() {}
            );
            return response.getBody() != null ? response.getBody() : Collections.emptyList();
        } catch (Exception e) {
            log.error("Failed to fetch partners from MDM service", e);
            return Collections.emptyList();
        }
    }

    public boolean isValidWarehouse(Long id) {
        if (id == null) return false;
        return getWarehouses().stream().anyMatch(w -> id.equals(w.getId()));
    }

    public boolean isValidCustomer(Long id) {
        if (id == null) return false;
        return getCustomers().stream().anyMatch(c -> id.equals(c.getId()));
    }

    public boolean isValidPartner(Long id) {
        if (id == null) return false;
        return getPartners().stream().anyMatch(p -> id.equals(p.getId()));
    }
}
