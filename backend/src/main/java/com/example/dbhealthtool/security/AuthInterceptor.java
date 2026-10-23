package com.example.dbhealthtool.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.Set;

/**
 * Requires "Authorization: Bearer <jwt>" on every endpoint except the
 * public ones. The verified userId is exposed to controllers as the
 * request attribute "userId" (@RequestAttribute("userId")), so the client
 * can no longer choose which user it acts as.
 */
@Component
public class AuthInterceptor implements HandlerInterceptor {

    private static final Set<String> PUBLIC_PATHS =
            Set.of("/", "/auth/login", "/auth/register", "/error");

    private final JwtService jwtService;

    public AuthInterceptor(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    public boolean preHandle(
            HttpServletRequest request,
            HttpServletResponse response,
            Object handler
    ) throws Exception {

        // CORS preflight carries no Authorization header
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }

        if (PUBLIC_PATHS.contains(request.getRequestURI())) {
            return true;
        }

        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            int userId = jwtService.verify(header.substring(7).trim());
            if (userId > 0) {
                request.setAttribute("userId", userId);
                return true;
            }
        }

        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json");
        response.getWriter().write(
                "{\"status\":\"error\",\"success\":false,\"message\":\"Authentication required\"}"
        );
        return false;
    }
}
