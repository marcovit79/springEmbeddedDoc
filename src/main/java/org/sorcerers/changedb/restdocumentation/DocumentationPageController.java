package org.sorcerers.changedb.restdocumentation;

import org.springframework.context.annotation.Description;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class DocumentationPageController {

	@RequestMapping(value="/restdoc")
	@Description("REST API documentation")
	public String swaggwrDocumentationPage() {
		return "rest-documentation/swagger-rest-doc";
	}
}
