package lt.viko.eif.gbudreckyte.webbuilder.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RegisterRequest {

    @NotBlank(message = "Vardas yra privalomas")
    private String name;

    @NotBlank(message = "El. paštas yra privalomas")
    @Email(message = "Neteisingas el. pašto formatas")
    private String email;

    @NotBlank(message = "Slaptažodis yra privalomas")
    @Size(min = 6, message = "Slaptažodis turi būti bent 6 simbolių")
    private String password;
}