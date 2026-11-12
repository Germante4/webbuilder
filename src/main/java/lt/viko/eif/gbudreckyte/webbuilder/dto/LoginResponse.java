package lt.viko.eif.gbudreckyte.webbuilder.dto;

public record LoginResponse(
        String token,
        UserResponse user
) {}