package org.sorcerers.utils.jpadocs;

import org.sorcerers.changedb.MenuEntryLabel;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;


@Controller
@RequestMapping("/plugins/documentation")
public class JpadocWebPages {

	@RequestMapping("/model")
	@MenuEntryLabel("Model docs")
	public String getInfos() {
		return "uml";
	}
	
	
}
