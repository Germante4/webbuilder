package lt.viko.eif.gbudreckyte.webbuilder.dto;

import lt.viko.eif.gbudreckyte.webbuilder.model.Role;

import java.time.LocalDateTime;

public record UserResponse(
        Long id,
        String name,
        String email,
        Role role,
        LocalDateTime createdAt
) {}