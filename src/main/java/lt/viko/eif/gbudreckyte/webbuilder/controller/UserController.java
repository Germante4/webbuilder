package lt.viko.eif.gbudreckyte.webbuilder.controller;

import jakarta.validation.Valid;
import lt.viko.eif.gbudreckyte.webbuilder.dto.LoginRequest;
import lt.viko.eif.gbudreckyte.webbuilder.dto.LoginResponse;
import lt.viko.eif.gbudreckyte.webbuilder.dto.RegisterRequest;
import lt.viko.eif.gbudreckyte.webbuilder.dto.UserResponse;
import lt.viko.eif.gbudreckyte.webbuilder.model.User;
import lt.viko.eif.gbudreckyte.webbuilder.security.JwtService;
import lt.viko.eif.gbudreckyte.webbuilder.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class UserController {

    private final UserService userService;
    private final JwtService jwtService;

    public UserController(
            UserService userService,
            JwtService jwtService
    ) {
        this.userService = userService;
        this.jwtService = jwtService;
    }

    @PostMapping("/register")
    public ResponseEntity<UserResponse> register(
            @Valid @RequestBody RegisterRequest request
    ) {
        User user = userService.register(request);

        UserResponse response = new UserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole(),
                user.getCreatedAt()
        );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(
            @Valid @RequestBody LoginRequest request
    ) {
        User user = userService.login(request);

        String token = jwtService.generateToken(user);

        UserResponse userResponse = new UserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole(),
                user.getCreatedAt()
        );

        LoginResponse response = new LoginResponse(
                token,
                userResponse
        );

        return ResponseEntity.ok(response);
    }
}