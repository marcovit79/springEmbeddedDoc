package org.sorcerers.changedb.restdocumentation;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.mangofactory.swagger.configuration.SpringSwaggerConfig;
import com.mangofactory.swagger.models.dto.ApiInfo;
import com.mangofactory.swagger.models.dto.builder.ApiInfoBuilder;
import com.mangofactory.swagger.plugin.EnableSwagger;
import com.mangofactory.swagger.plugin.SwaggerSpringMvcPlugin;

@Configuration
@EnableSwagger
public class SwaggerConfig {

	@Value("${application.title:Rest API Documentation}")
	private String applicationTitle;
	
	private SpringSwaggerConfig springSwaggerConfig;

    @Autowired
    public void setSpringSwaggerConfig(SpringSwaggerConfig springSwaggerConfig) {
       this.springSwaggerConfig = springSwaggerConfig;
    }
    
    @Bean 
    public SwaggerSpringMvcPlugin springSwaggerPlugin(){
    	return new SwaggerSpringMvcPlugin(this.springSwaggerConfig)
    		.apiInfo(apiInfo())
    		.includePatterns(".*/rest/.*");
    }
    
    private ApiInfo apiInfo() {
    	return new ApiInfoBuilder()
    		.title(applicationTitle)
    		.description("")
    		.build();
    }


}
