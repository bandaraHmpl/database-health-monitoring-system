package com.example.dbhealthtool.model;

public class ReportInfo {

    private String id;
    private String type;
    private String createdOn;
    private String status;
    private String size;
    private String fileName;

    public ReportInfo() {}

    public ReportInfo(
            String id,
            String type,
            String createdOn,
            String status,
            String size,
            String fileName
    ) {
        this.id = id;
        this.type = type;
        this.createdOn = createdOn;
        this.status = status;
        this.size = size;
        this.fileName = fileName;
    }

    public String getId() {
        return id;
    }

    public String getType() {
        return type;
    }

    public String getCreatedOn() {
        return createdOn;
    }

    public String getStatus() {
        return status;
    }

    public String getSize() {
        return size;
    }

    public String getFileName() {
        return fileName;
    }

    public void setId(String id) {
        this.id = id;
    }

    public void setType(String type) {
        this.type = type;
    }

    public void setCreatedOn(String createdOn) {
        this.createdOn = createdOn;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public void setSize(String size) {
        this.size = size;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }
}