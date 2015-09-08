package org.sorcerers.utils.jpadocs;

import org.springframework.context.annotation.Description;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;


@Controller
@RequestMapping("/plugins/documentation")
public class JpadocWebPages {

	@RequestMapping("/model")
	@Description("Model docs")
	public String getInfos() {
		return "uml";
	}
	
	
}
