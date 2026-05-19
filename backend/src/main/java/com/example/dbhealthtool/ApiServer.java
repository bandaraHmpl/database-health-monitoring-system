package com.example.dbhealthtool;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ApiServer {

    public static void main(String[] args) {

        SpringApplication.run(ApiServer.class, args);

        System.out.println("DB Health Tool API Running...");
    }
}