package com.logistics.platform.service.system;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.security.test.context.support.WithMockUser;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("local")
public class FavoriteTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @WithMockUser(username = "admin")
    public void testToggleFavoriteWeb() throws Exception {
        mockMvc.perform(post("/api/v1/system/favorites/1/toggle")
                .contentType("application/json")
                .content("{}"))
                .andExpect(status().isOk());
    }
}
