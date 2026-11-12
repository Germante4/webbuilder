package lt.viko.eif.gbudreckyte.webbuilder.controller;

import jakarta.validation.Valid;
import lt.viko.eif.gbudreckyte.webbuilder.dto.CreateProjectRequest;
import lt.viko.eif.gbudreckyte.webbuilder.dto.ProjectResponse;
import lt.viko.eif.gbudreckyte.webbuilder.model.Project;
import lt.viko.eif.gbudreckyte.webbuilder.model.User;
import lt.viko.eif.gbudreckyte.webbuilder.service.ProjectService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import lt.viko.eif.gbudreckyte.webbuilder.dto.UpdateProjectRequest;


import java.util.List;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {

    private final ProjectService projectService;

    public ProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }

    @PostMapping
    public ResponseEntity<ProjectResponse> createProject(
            @Valid @RequestBody CreateProjectRequest request,
            Authentication authentication
    ) {

        User currentUser = (User) authentication.getPrincipal();

        Project project = projectService.createProject(
                request,
                currentUser
        );

        ProjectResponse response = new ProjectResponse(
                project.getId(),
                project.getName(),
                project.getDescription(),
                project.getStatus(),
                project.getWebsiteCategory(),
                project.getCreatedAt(),
                project.getUpdatedAt(),
                project.getStitchProjectId(),
                project.getStitchScreenId()
        );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }
    @GetMapping
    public ResponseEntity<List<ProjectResponse>> getProjects(
            Authentication authentication
    ) {
        User currentUser = (User) authentication.getPrincipal();

        List<ProjectResponse> projects = projectService
                .getUserProjects(currentUser)
                .stream()
                .map(project -> new ProjectResponse(
                        project.getId(),
                        project.getName(),
                        project.getDescription(),
                        project.getStatus(),
                        project.getWebsiteCategory(),
                        project.getCreatedAt(),
                        project.getUpdatedAt(),
                        project.getStitchProjectId(),
                        project.getStitchScreenId()
                ))
                .toList();

        return ResponseEntity.ok(projects);
    }
    @GetMapping("/{id}")
    public ResponseEntity<ProjectResponse> getProjectById(
            @PathVariable Long id,
            Authentication authentication
    ) {
        User currentUser = (User) authentication.getPrincipal();

        Project project = projectService.getProjectById(id, currentUser);

        ProjectResponse response = new ProjectResponse(
                project.getId(),
                project.getName(),
                project.getDescription(),
                project.getStatus(),
                project.getWebsiteCategory(),
                project.getCreatedAt(),
                project.getUpdatedAt(),
                project.getStitchProjectId(),
                project.getStitchScreenId()
        );

        return ResponseEntity.ok(response);
    }
    @PutMapping("/{id}")
    public ResponseEntity<ProjectResponse> updateProject(
            @PathVariable Long id,
            @Valid @RequestBody UpdateProjectRequest request,
            Authentication authentication
    ) {
        User currentUser = (User) authentication.getPrincipal();

        Project project = projectService.updateProject(
                id,
                request,
                currentUser
        );

        ProjectResponse response = new ProjectResponse(
                project.getId(),
                project.getName(),
                project.getDescription(),
                project.getStatus(),
                project.getWebsiteCategory(),
                project.getCreatedAt(),
                project.getUpdatedAt(),
                project.getStitchProjectId(),
                project.getStitchScreenId()
        );

        return ResponseEntity.ok(response);
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProject(
            @PathVariable Long id,
            Authentication authentication
    ) {
        User currentUser = (User) authentication.getPrincipal();

        projectService.deleteProject(id, currentUser);

        return ResponseEntity.noContent().build();
    }
}