package com.logistics.platform.config;

import com.logistics.platform.domain.system.DetailCode;
import com.logistics.platform.domain.system.MasterCode;
import com.logistics.platform.domain.system.Role;
import com.logistics.platform.domain.system.User;
import com.logistics.platform.domain.system.Menu;
import com.logistics.platform.repository.system.DetailCodeRepository;
import com.logistics.platform.repository.system.MasterCodeRepository;
import com.logistics.platform.repository.system.RoleRepository;
import com.logistics.platform.domain.system.UserAuth;
import com.logistics.platform.repository.system.UserAuthRepository;
import com.logistics.platform.repository.system.UserRepository;
import com.logistics.platform.domain.system.MenuTranslation;
import com.logistics.platform.domain.system.Message;
import com.logistics.platform.domain.system.MessageTranslation;
import com.logistics.platform.domain.system.MasterCodeTranslation;
import com.logistics.platform.domain.system.DetailCodeTranslation;
import com.logistics.platform.repository.system.MenuRepository;
import com.logistics.platform.repository.system.MessageRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.LocalDateTime;
import java.util.Map;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.core.type.TypeReference;

@Configuration
@RequiredArgsConstructor
public class DataInitializer {

        private final UserRepository userRepository;
        private final RoleRepository roleRepository;
        private final MasterCodeRepository masterCodeRepository;
        private final DetailCodeRepository detailCodeRepository;
        private final MenuRepository menuRepository;
        private final MessageRepository messageRepository;
        private final UserAuthRepository userAuthRepository;
        private final PasswordEncoder passwordEncoder;
        private final ObjectMapper objectMapper;

        @Bean
        public CommandLineRunner initData() {
                return args -> {
                        try {
                                java.io.InputStream inputStream = getClass().getResourceAsStream("/initial-data.json");
                                if (inputStream == null) {
                                        System.out.println("Warning: initial-data.json not found in classpath");
                                        return;
                                }

                                JsonNode root = objectMapper.readTree(inputStream);

                                // 1. Roles
                                if (root.has("roles")) {
                                        for (JsonNode node : root.get("roles")) {
                                                String name = node.path("name").asText();
                                                if (!name.isEmpty() && !roleRepository.existsById(name)) {
                                                        roleRepository.save(new Role(name,
                                                                        node.path("description").asText(),
                                                                        node.path("sortOrder").asInt()));
                                                }
                                        }
                                }

                                // 2. Users
                                if (root.has("users")) {
                                        for (JsonNode node : root.get("users")) {
                                                String id = node.path("id").asText();
                                                if (!id.isEmpty() && !userRepository.existsById(id)) {
                                                        userRepository.save(new User(id,
                                                                        node.path("username").asText(),
                                                                        node.path("name").asText(),
                                                                        node.path("department").asText(),
                                                                        LocalDateTime.now(),
                                                                        node.path("status").asText(),
                                                                        node.path("langCode").asText()));
                                                }
                                        }
                                }

                                // 3. UserAuths
                                if (root.has("userAuths")) {
                                        for (JsonNode node : root.get("userAuths")) {
                                                String username = node.path("username").asText();
                                                if (!username.isEmpty() && !userAuthRepository.findByUsername(username)
                                                                .isPresent()) {
                                                        userAuthRepository.save(new UserAuth(null, username,
                                                                        passwordEncoder.encode(
                                                                                        node.path("password").asText()),
                                                                        node.path("email").asText(),
                                                                        node.path("role").asText()));
                                                }
                                        }
                                }

                                // 4. MasterCodes
                                if (root.has("masterCodes")) {
                                        for (JsonNode node : root.get("masterCodes")) {
                                                String id = node.path("id").asText();
                                                if (id.isEmpty())
                                                        continue;

                                                String name = node.path("name").asText();
                                                String description = node.path("description").asText();
                                                Map<String, String> translations = objectMapper.convertValue(
                                                                node.get("translations"),
                                                                new TypeReference<Map<String, String>>() {
                                                                });
                                                upsertMasterCode(id, name, description, translations);
                                        }
                                }

                                // 5. DetailCodes
                                if (root.has("detailCodes")) {
                                        for (JsonNode node : root.get("detailCodes")) {
                                                String masterId = node.path("masterId").asText();
                                                String code = node.path("code").asText();
                                                if (masterId.isEmpty() || code.isEmpty())
                                                        continue;

                                                String label = node.path("label").asText();
                                                int sortOrder = node.path("sortOrder").asInt();
                                                String useYn = node.path("useYn").asText();
                                                Map<String, String> translations = objectMapper.convertValue(
                                                                node.get("translations"),
                                                                new TypeReference<Map<String, String>>() {
                                                                });
                                                upsertDetailCode(masterId, code, label, sortOrder, useYn, translations);
                                        }
                                }

                                // 6. Menus
                                if (root.has("menus")) {
                                        // We might need multiple passes or careful ordering for parents
                                        // For simplicity, let's assume parents are defined before children in JSON or
                                        // handled by title lookup
                                        for (JsonNode node : root.get("menus")) {
                                                String menuKey = node.get("menuKey").asText();
                                                String path = node.has("path") && !node.get("path").isNull()
                                                                ? node.get("path").asText()
                                                                : null;
                                                String icon = node.has("icon") && !node.get("icon").isNull()
                                                                ? node.get("icon").asText()
                                                                : null;
                                                int sortOrder = node.get("sortOrder").asInt();
                                                String isVisible = node.get("isVisible").asText();
                                                String parentTitle = node.has("parentTitle")
                                                                && !node.get("parentTitle").isNull()
                                                                                ? node.get("parentTitle").asText()
                                                                                : null;

                                                Long parentId = null;
                                                if (parentTitle != null) {
                                                        java.util.List<Menu> parents = menuRepository
                                                                        .findByMenuKey(parentTitle);
                                                        if (!parents.isEmpty()) {
                                                                parentId = parents.get(0).getId();
                                                        }
                                                }

                                                Map<String, String> translations = objectMapper.convertValue(
                                                                node.get("translations"),
                                                                new TypeReference<Map<String, String>>() {
                                                                });
                                                upsertMenu(menuKey, path, icon, sortOrder, isVisible, parentId,
                                                                translations);
                                        }
                                }

                                // 7. Messages
                                if (root.has("messages")) {
                                        for (JsonNode node : root.get("messages")) {
                                                String key = node.path("key").asText();
                                                if (key.isEmpty())
                                                        continue;

                                                String category = node.path("category").asText();
                                                String description = node.path("description").asText();
                                                Map<String, String> translations = objectMapper.convertValue(
                                                                node.get("translations"),
                                                                new TypeReference<Map<String, String>>() {
                                                                });
                                                upsertMessage(key, category, description, translations);
                                        }
                                }

                                // 8. Cleanup obsolete and duplicate menus
                                menuRepository.findAll().stream()
                                                .filter(m -> m.getMenuKey() == null || m.getMenuKey().trim().isEmpty())
                                                .forEach(menuRepository::delete);

                                menuRepository.findByMenuKey("sidebar.master_code").forEach(menuRepository::delete);
                                menuRepository.findByMenuKey("sidebar.detail_code").forEach(menuRepository::delete);

                        } catch (Exception e) {
                                System.err.println("Error initializing data from JSON: " + e.getMessage());
                                e.printStackTrace();
                        }
                };

        }

        private Menu upsertMenu(String menuKey, String path, String icon, int sortOrder, String isVisible,
                        Long parentId,
                        Map<String, String> translations) {
                java.util.List<Menu> existingMenus = menuRepository.findByMenuKey(menuKey);
                Menu menu;
                if (existingMenus.isEmpty()) {
                        menu = new Menu();
                } else {
                        menu = existingMenus.get(0);
                        // Cleanup duplicates if any
                        if (existingMenus.size() > 1) {
                                System.out.println("Cleaning up " + (existingMenus.size() - 1)
                                                + " duplicate menus for key: " + menuKey);
                                for (int i = 1; i < existingMenus.size(); i++) {
                                        Menu toDelete = existingMenus.get(i);
                                        if (toDelete != null) {
                                                menuRepository.delete(toDelete);
                                        }
                                }
                        }
                }

                menu.setMenuKey(menuKey);
                menu.setPath(path);
                menu.setIcon(icon);
                menu.setSortOrder(sortOrder);
                menu.setIsVisible(isVisible);
                menu.setParentId(parentId);
                menu.setIsPc("Y");
                menu.setIsMobile("Y");

                // Update translations
                if (translations != null) {
                        menu.getTranslations().clear();
                        for (Map.Entry<String, String> entry : translations.entrySet()) {
                                menu.getTranslations().add(MenuTranslation.builder()
                                                .menu(menu)
                                                .langCode(entry.getKey())
                                                .title(entry.getValue())
                                                .build());
                        }
                }

                return menuRepository.save(menu);
        }

        private Message upsertMessage(String key, String category, String description,
                        Map<String, String> translations) {
                Message message = messageRepository.findByMessageKey(key).orElse(new Message());
                message.setMessageKey(key);
                message.setCategory(category);
                message.setDescription(description);

                if (translations != null) {
                        message.getTranslations().clear();
                        for (Map.Entry<String, String> entry : translations.entrySet()) {
                                message.getTranslations().add(MessageTranslation.builder()
                                                .message(message)
                                                .langCode(entry.getKey())
                                                .content(entry.getValue())
                                                .build());
                        }
                }
                return messageRepository.save(message);
        }

        private void upsertMasterCode(String id, String name, String description, Map<String, String> translations) {
                if (id == null)
                        return;
                MasterCode code = masterCodeRepository.findById(id).orElse(new MasterCode());
                code.setId(id);
                code.setName(name);
                code.setDescription(description);

                if (translations != null) {
                        code.getTranslations().clear();
                        for (Map.Entry<String, String> entry : translations.entrySet()) {
                                code.getTranslations().add(MasterCodeTranslation.builder()
                                                .masterCode(code)
                                                .langCode(entry.getKey())
                                                .name(entry.getValue())
                                                .build());
                        }
                }
                masterCodeRepository.save(code);
        }

        private void upsertDetailCode(String masterId, String codeValue, String label, int sortOrder, String useYn,
                        Map<String, String> translations) {
                if (masterId == null || codeValue == null)
                        return;
                DetailCode code = detailCodeRepository.findByMasterCodeIdAndCode(masterId, codeValue)
                                .orElse(new DetailCode());
                code.setMasterCodeId(masterId);
                code.setCode(codeValue);
                code.setLabel(label);
                code.setSortOrder(sortOrder);
                code.setUseYn(useYn);

                if (translations != null) {
                        code.getTranslations().clear();
                        for (Map.Entry<String, String> entry : translations.entrySet()) {
                                code.getTranslations().add(DetailCodeTranslation.builder()
                                                .detailCode(code)
                                                .langCode(entry.getKey())
                                                .label(entry.getValue())
                                                .build());
                        }
                }
                detailCodeRepository.save(code);
        }
}
