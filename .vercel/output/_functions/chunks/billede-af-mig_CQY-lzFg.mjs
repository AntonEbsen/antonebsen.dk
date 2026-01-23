const myImage = new Proxy({"src":"/_astro/billede-af-mig.6npk87xU.jpg","width":2362,"height":3543,"format":"jpg","orientation":1}, {
						get(target, name, receiver) {
							if (name === 'clone') {
								return structuredClone(target);
							}
							if (name === 'fsPath') {
								return "C:/Users/Anton/antonebsen.dk/src/assets/img/billede-af-mig.jpg";
							}
							
							return target[name];
						}
					});

export { myImage as m };
