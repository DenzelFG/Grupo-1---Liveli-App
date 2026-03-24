// Dom7
var $$ = Dom7;

var mainRoutes = [
	{ path: '/home/', url: 'pages/home.html', name: 'home' },
	{ path: '/sobre-liveli/', url: 'pages/acerca.html', name: 'sobre-liveli' },
	{ path: '/decoracion/', url: 'pages/decoracion.html', name: 'decoracion' },
	{ path: '/decoracion-galeria/', url: 'pages/decoracion-galeria.html', name: 'decoracion-galeria' },
	{ path: '/muebles/', url: 'pages/muebles.html', name: 'muebles' },
	{ path: '/muebles-galeria/', url: 'pages/muebles-galeria.html', name: 'muebles-galeria' },
	{ path: '/ofertas/', url: 'pages/ofertas.html', name: 'ofertas' },
	{ path: '/producto-mueble/', url: 'pages/producto-mueble.html', name: 'producto-mueble' },
	{ path: '/producto-decoracion/', url: 'pages/producto-decoracion.html', name: 'producto-decoracion' },
	{ path: '/contacto/', url: 'pages/contacto.html', name: 'contacto' },
	{ path: '/ubicacion/', url: 'pages/ubicacion.html', name: 'ubicacion' },
	{ path: '/favoritos/', url: 'pages/favoritos.html', name: 'favoritos' }
];

// Init App
var app = new Framework7({
  	id: 'com.app',
  	root: '#app',
	theme: 'md',
	view: {
		browserHistory: false,
		xhrCache: false
    },
	cache:false,
	cacheDuration: 0,
	modalTitle: 'Order',
	on: {
		pageAfterIn: function (page) {
			if (!page.route || !page.route.path) {
				return;
			}
			$$('.bottom-nav-link').removeClass('bottom-nav-link-active');
			$$('.bottom-nav-link[data-match="' + page.route.path + '"]').addClass('bottom-nav-link-active');
			$$('.liveli-panel a').removeClass('panel-link-active');
			$$('.liveli-panel .sidebar-group').removeClass('sidebar-group-open');
			var activePanelLinks = $$('.liveli-panel a[href="' + page.route.path + '"]');
			activePanelLinks.addClass('panel-link-active');
			activePanelLinks.each(function () {
				$$(this).parents('.sidebar-group').addClass('sidebar-group-open');
			});
		}
	},
	panel: {
		swipe: true,
	},
	routes: mainRoutes,
	popup: {
		closeOnEscape: true,
		backdrop : false
	},
	sheet: {
		closeOnEscape: true,
	},
	popover: {
		closeOnEscape: true,
	},
	actions: {
		closeOnEscape: true,
	}
});

app.views.create('.view-main', {
	url: '/home/'
});

var searchPopup = app.popup.create({
	content:
		'<div class="popup search-popup">' +
			'<div class="view">' +
				'<div class="page">' +
					'<div class="page-content search-popup-content">' +
						'<div class="search-header">' +
							'<i class="material-icons">search</i>' +
							'<input type="search" class="search-input js-search-input" placeholder="Buscar producto, categoria o subcategoria" autocomplete="off">' +
							'<a href="#" class="link popup-close search-close"><i class="material-icons">close</i></a>' +
						'</div>' +
						'<div class="search-results js-search-results"></div>' +
					'</div>' +
				'</div>' +
			'</div>' +
		'</div>'
});

var catalogPromise = null;
var FAVORITES_KEY = 'liveli-favorites';
var homeHeroSwiper = null;
var HERO_IMAGES = ['img/hero1.png', 'img/hero2.jpg', 'img/hero3.png', 'img/hero4.png'];
var categoryCopy = {
	muebles: {
		highlight: 'Piezas que definen tu espacio y elevan tu hogar.',
		description: 'En Liveli entendemos que un sofa o una mesa son mas que objetos; son el escenario principal de momentos importantes en tu vida.',
		enfoque: 'Creamos propuestas de mobiliario funcional con materiales duraderos y lineas contemporaneas para un hogar equilibrado.',
		servicios: ['Asesoria de distribucion', 'Selecciones por estilo', 'Piezas para espacios compactos']
	},
	decoracion: {
		highlight: 'Cada rincon de tu hogar cuenta una historia.',
		description: 'En Liveli curamos objetos decorativos que no solo embellecen, sino que elevan la armonia de tus espacios.',
		enfoque: 'Seleccionamos decoracion con identidad visual para transformar ambientes comunes en espacios memorables.',
		servicios: ['Curaduria por coleccion', 'Combinaciones por color', 'Accesorios para acentos visuales']
	}
};

function escapeHtml(value) {
	return String(value || '').replace(/[&<>"']/g, function (char) {
		return {
			'&': '&amp;',
			'<': '&lt;',
			'>': '&gt;',
			'"': '&quot;',
			"'": '&#39;'
		}[char];
	});
}

function loadCatalog() {
	if (catalogPromise) {
		return catalogPromise;
	}
	catalogPromise = fetch('productos.json', { cache: 'no-store' })
		.then(function (response) {
			if (!response.ok) {
				throw new Error('No se pudo cargar productos.json');
			}
			return response.json();
		})
		.catch(function () {
			return { categorias: { muebles: [], decoracion: [] } };
		});
	return catalogPromise;
}

function getCategoryProducts(catalog, categoryKey) {
	return (catalog.categorias && catalog.categorias[categoryKey]) || [];
}

function getDetailPathByCategory(categoryKey) {
	return categoryKey === 'muebles' ? '/producto-mueble/' : '/producto-decoracion/';
}

function getAllCatalogProducts(catalog) {
	var result = [];
	['muebles', 'decoracion'].forEach(function (categoryKey) {
		getCategoryProducts(catalog, categoryKey).forEach(function (product) {
			result.push({
				id: product.id,
				nombre: product.nombre,
				subcategoria: product.subcategoria,
				imagen: product.imagen,
				descripcion: product.descripcion,
				colores: product.colores || [],
				tamanos: product.tamanos || [],
				categoria: categoryKey
			});
		});
	});
	return result;
}

function getFavoriteIds() {
	var raw = localStorage.getItem(FAVORITES_KEY);
	if (!raw) {
		return [];
	}
	try {
		var parsed = JSON.parse(raw);
		return Array.isArray(parsed) ? parsed : [];
	} catch (error) {
		return [];
	}
}

function saveFavoriteIds(ids) {
	localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
}

function isFavoriteProduct(productId) {
	return getFavoriteIds().indexOf(productId) !== -1;
}

function toggleFavoriteProduct(productId) {
	var ids = getFavoriteIds();
	var index = ids.indexOf(productId);
	if (index === -1) {
		ids.push(productId);
	} else {
		ids.splice(index, 1);
	}
	saveFavoriteIds(ids);
	return ids.indexOf(productId) !== -1;
}

function updateFavoriteToggleState(contextEl) {
	var root = contextEl ? $$(contextEl) : $$(document);
	root.find('.favorite-toggle').each(function () {
		var button = $$(this);
		var productId = button.attr('data-product-id');
		var active = isFavoriteProduct(productId);
		button.toggleClass('favorite-toggle-active', active);
		button.find('.favorite-toggle-label').text(active ? 'Quitar de favoritos' : 'Agregar a favoritos');
		button.find('.material-icons').text(active ? 'favorite' : 'favorite_border');
	});
}

function buildMiniCardHtml(product) {
	var detailPath = getDetailPathByCategory(product.categoria);
	return '' +
		'<a class="mini-card link home-mini-card" href="' + detailPath + '?id=' + encodeURIComponent(product.id) + '">' +
			'<img src="' + escapeHtml(product.imagen) + '" alt="' + escapeHtml(product.nombre) + '">' +
			'<p>' + escapeHtml(product.nombre) + '</p>' +
			'<span class="mini-card-meta">' + escapeHtml(product.subcategoria || product.categoria || '') + '</span>' +
		'</a>';
}

function buildHomeShowcaseCardHtml(product) {
	var detailPath = getDetailPathByCategory(product.categoria);
	return '' +
		'<a class="home-product-card link" href="' + detailPath + '?id=' + encodeURIComponent(product.id) + '">' +
			'<img src="' + escapeHtml(product.imagen) + '" alt="' + escapeHtml(product.nombre) + '">' +
			'<div class="home-product-copy">' +
				'<strong>' + escapeHtml(product.nombre) + '</strong>' +
				'<span>' + escapeHtml(product.subcategoria || '') + '</span>' +
			'</div>' +
		'</a>';
}

function buildCategoryProductCardHtml(product) {
	var detailPath = getDetailPathByCategory(product.categoria);
	return '' +
		'<a class="category-product-card link" href="' + detailPath + '?id=' + encodeURIComponent(product.id) + '">' +
			'<img src="' + escapeHtml(product.imagen) + '" alt="' + escapeHtml(product.nombre) + '">' +
			'<div class="category-product-copy">' +
				'<strong>' + escapeHtml(product.nombre) + '</strong>' +
				'<span>' + escapeHtml(product.subcategoria || '') + '</span>' +
			'</div>' +
		'</a>';
}

function buildSearchResultItemHtml(product) {
	var detailPath = getDetailPathByCategory(product.categoria);
	return '' +
		'<a class="search-result-item link popup-close" href="' + detailPath + '?id=' + encodeURIComponent(product.id) + '">' +
			'<img src="' + escapeHtml(product.imagen) + '" alt="' + escapeHtml(product.nombre) + '">' +
			'<div class="search-result-copy">' +
				'<strong>' + escapeHtml(product.nombre) + '</strong>' +
				'<span>' + escapeHtml((product.categoria || '') + ' · ' + (product.subcategoria || '')) + '</span>' +
			'</div>' +
			'<i class="material-icons">chevron_right</i>' +
		'</a>';
}

function renderSearchResults(query) {
	var container = $$('.js-search-results');
	if (!container.length) {
		return;
	}
	var normalizedQuery = String(query || '').trim().toLowerCase();
	loadCatalog().then(function (catalog) {
		var products = getAllCatalogProducts(catalog);
		if (!normalizedQuery) {
			var featured = products.slice(0, 6);
			if (!featured.length) {
				container.html('<div class="search-empty">No hay productos disponibles.</div>');
				return;
			}
			container.html(
				'<div class="search-hint">Empieza escribiendo para buscar en el catalogo.</div>' +
				featured.map(buildSearchResultItemHtml).join('')
			);
			return;
		}
		var filtered = products.filter(function (item) {
			var text = [item.nombre, item.subcategoria, item.categoria, item.descripcion].join(' ').toLowerCase();
			return text.indexOf(normalizedQuery) !== -1;
		}).slice(0, 14);
		if (!filtered.length) {
			container.html('<div class="search-empty">No encontramos productos para "' + escapeHtml(normalizedQuery) + '".</div>');
			return;
		}
		container.html(filtered.map(buildSearchResultItemHtml).join(''));
	});
}

function trimText(value, maxLength) {
	var text = String(value || '');
	if (text.length <= maxLength) {
		return text;
	}
	return text.slice(0, maxLength - 1).trim() + '...';
}

function buildHomeHeroSlidesHtml(products) {
	return (products || []).map(function (product, index) {
		var title = trimText(product.nombre || 'LIVELI', 22).toUpperCase();
		var subtitle = trimText((product.subcategoria || '') + ' · ' + (product.descripcion || ''), 88);
		var heroImage = HERO_IMAGES[index % HERO_IMAGES.length];
		return '' +
			'<div class="swiper-slide home-hero-slide">' +
				'<img src="' + escapeHtml(heroImage) + '" alt="' + escapeHtml(product.nombre || 'Hero LIVELI') + '">' +
				'<div class="hero-overlay small home-hero-overlay">' +
					'<h2>' + escapeHtml(title) + '</h2>' +
					'<p>' + escapeHtml(subtitle) + '</p>' +
				'</div>' +
			'</div>';
	}).join('');
}

function renderHomeHeroFromCatalog(pageEl) {
	var hero = $$(pageEl).find('.js-home-hero');
	if (!hero.length) {
		return Promise.resolve();
	}
	return loadCatalog().then(function (catalog) {
		var allProducts = getAllCatalogProducts(catalog);
		var slides = allProducts.slice(0, 5);
		if (!slides.length) {
			hero.html('' +
				'<img src="img/hero1.png" alt="Sala elegante">' +
				'<div class="hero-overlay small"><h2>LIVELI</h2><p>Elegancia que innova tu hogar</p></div>'
			);
			return;
		}
		hero.html('' +
			'<div class="swiper-container swiper home-hero-swiper">' +
				'<div class="swiper-wrapper">' + buildHomeHeroSlidesHtml(slides) + '</div>' +
				'<div class="swiper-pagination home-hero-pagination"></div>' +
			'</div>'
		);
		if (homeHeroSwiper && homeHeroSwiper.destroy) {
			homeHeroSwiper.destroy(true, true);
		}
		homeHeroSwiper = app.swiper.create(hero.find('.home-hero-swiper')[0], {
			loop: true,
			speed: 550,
			autoplay: {
				delay: 3200,
				disableOnInteraction: false
			},
			pagination: {
				el: hero.find('.home-hero-pagination')[0],
				clickable: true
			}
		});
	});
}

function renderHomeFromCatalog(pageEl) {
	var target = $$(pageEl).find('.js-home-sections');
	if (!target.length) {
		return Promise.resolve();
	}
	return loadCatalog().then(function (catalog) {
		var allProducts = getAllCatalogProducts(catalog);
		var muebles = getCategoryProducts(catalog, 'muebles').map(function (item) {
			item.categoria = 'muebles';
			return item;
		});
		var decoracion = getCategoryProducts(catalog, 'decoracion').map(function (item) {
			item.categoria = 'decoracion';
			return item;
		});
		var favoriteIds = getFavoriteIds();
		var totalSubcategories = Object.keys(productsBySubcategory(allProducts)).length;
		var trending = allProducts.slice(0, 4);
		var recommended = allProducts.slice(4, 8);
		var latest = allProducts.slice().reverse().slice(0, 4);
		var decoracionCount = decoracion.length;
		var mueblesCount = muebles.length;
		var mixedCollection = [];
		if (muebles.length) {
			mixedCollection.push(muebles[0]);
		}
		if (decoracion.length) {
			mixedCollection.push(decoracion[0]);
		}
		if (muebles.length > 1) {
			mixedCollection.push(muebles[1]);
		}
		if (decoracion.length > 1) {
			mixedCollection.push(decoracion[1]);
		}
		var uniqueSubcategories = Object.keys(productsBySubcategory(allProducts));
		var categoryHighlights = [
			{
				titulo: 'Muebles',
				cantidad: mueblesCount,
				ruta: '/muebles-galeria/',
				items: muebles.slice(0, 2)
			},
			{
				titulo: 'Decoracion',
				cantidad: decoracionCount,
				ruta: '/decoracion-galeria/',
				items: decoracion.slice(0, 2)
			}
		];
		var html = '';
		html += '<section class="home-stats">';
		html += '<article><strong>' + allProducts.length + '</strong><span>Productos</span></article>';
		html += '<article><strong>' + totalSubcategories + '</strong><span>Colecciones</span></article>';
		html += '<article><strong>' + favoriteIds.length + '</strong><span>Favoritos</span></article>';
		html += '</section>';

		html += '<section class="home-section-block">';
		html += '<h3 class="section-title">Coleccion destacada</h3>';
		html += '<div class="home-product-grid">' + mixedCollection.map(buildHomeShowcaseCardHtml).join('') + '</div>';
		html += '</section>';

		html += '<section class="home-section-block">';
		html += '<h3 class="section-title">Trending esta semana</h3>';
		html += '<div class="mini-cards">' + trending.map(buildMiniCardHtml).join('') + '</div>';
		html += '</section>';

		html += '<section class="home-section-block">';
		html += '<h3 class="section-title">Recomendados</h3>';
		html += '<div class="mini-cards">' + recommended.map(buildMiniCardHtml).join('') + '</div>';
		html += '</section>';

		html += '<section class="home-section-block">';
		html += '<h3 class="section-title">Subcategorias</h3>';
		html += '<div class="home-chip-row">' + uniqueSubcategories.map(function (name) {
			return '<span class="home-chip">' + escapeHtml(name) + '</span>';
		}).join('') + '</div>';
		html += '</section>';

		html += '<section class="home-section-block home-category-cards">';
		html += categoryHighlights.map(function (section) {
			return '' +
				'<article class="home-category-card">' +
					'<div class="home-category-head">' +
						'<h4>' + escapeHtml(section.titulo) + '</h4>' +
						'<span>' + escapeHtml(section.cantidad) + ' productos</span>' +
					'</div>' +
					'<div class="home-category-items">' + section.items.map(buildMiniCardHtml).join('') + '</div>' +
					'<a href="' + section.ruta + '" class="link home-category-link">Ver galeria</a>' +
				'</article>';
		}).join('');
		html += '</section>';

		html += '<section class="home-section-block">';
		html += '<h3 class="section-title">Recien agregados</h3>';
		html += '<div class="mini-cards">' + latest.map(buildMiniCardHtml).join('') + '</div>';
		html += '</section>';
		target.html(html);
	});
}

function renderCategoryContentFromCatalog(pageEl, categoryKey) {
	var target = $$(pageEl).find('.js-category-content');
	if (!target.length) {
		return Promise.resolve();
	}
	return loadCatalog().then(function (catalog) {
		var products = getCategoryProducts(catalog, categoryKey);
		var first = products[0] || null;
		var second = products[1] || first;
		if (!first) {
			target.html('<section class="detail"><p>No hay productos cargados para esta categoria.</p></section>');
			return;
		}
		var copy = categoryCopy[categoryKey] || { highlight: '', description: '' };
		var subcategories = Object.keys(productsBySubcategory(products));
		var favoritos = getFavoriteIds();
		var favoritosEnCategoria = products.filter(function (item) {
			return favoritos.indexOf(item.id) !== -1;
		}).length;
		var featured = products.slice(0, 4).map(function (item) {
			return {
				id: item.id,
				nombre: item.nombre,
				subcategoria: item.subcategoria,
				imagen: item.imagen,
				categoria: categoryKey
			};
		});
		var html = '';
		html += '<section class="highlight-banner">';
		if (categoryKey === 'muebles') {
			html += '<h3>' + escapeHtml(copy.highlight) + '</h3>';
			html += '<img src="' + escapeHtml(first.imagen) + '" alt="' + escapeHtml(first.nombre) + '">';
		} else {
			html += '<img src="' + escapeHtml(first.imagen) + '" alt="' + escapeHtml(first.nombre) + '">';
			html += '<h3>' + escapeHtml(copy.highlight) + '</h3>';
		}
		html += '</section>';
		html += '<section class="split">';
		html += '<img src="' + escapeHtml(second.imagen) + '" alt="' + escapeHtml(second.nombre) + '">';
		html += '<p>' + escapeHtml(copy.description || first.descripcion || '') + '</p>';
		html += '</section>';
		html += '<section class="category-insight-grid">';
		html += '<article><strong>' + products.length + '</strong><span>Productos activos</span></article>';
		html += '<article><strong>' + subcategories.length + '</strong><span>Subcategorias</span></article>';
		html += '<article><strong>' + favoritosEnCategoria + '</strong><span>En favoritos</span></article>';
		html += '</section>';
		html += '<section class="category-rich-text">';
		html += '<h4>Enfoque de la coleccion</h4>';
		html += '<p>' + escapeHtml(copy.enfoque || '') + '</p>';
		html += '<div class="category-points">' + (copy.servicios || []).map(function (item) {
			return '<span>' + escapeHtml(item) + '</span>';
		}).join('') + '</div>';
		html += '<div class="category-subcats">' + subcategories.map(function (name) {
			return '<em>' + escapeHtml(name) + '</em>';
		}).join('') + '</div>';
		html += '</section>';
		html += '<section class="category-featured">';
		html += '<h4>Productos destacados</h4>';
		html += '<div class="category-product-row">' + featured.map(buildCategoryProductCardHtml).join('') + '</div>';
		html += '</section>';
		target.html(html);
	});
}

function renderFavoritesFromCatalog(pageEl) {
	var target = $$(pageEl).find('.js-favorites-list');
	var countTarget = $$(pageEl).find('.js-favorites-count');
	if (!target.length) {
		return Promise.resolve();
	}
	return loadCatalog().then(function (catalog) {
		var favoriteIds = getFavoriteIds();
		var products = getAllCatalogProducts(catalog);
		var favoriteProducts = products.filter(function (item) {
			return favoriteIds.indexOf(item.id) !== -1;
		});
		if (countTarget.length) {
			countTarget.text(favoriteProducts.length);
		}
		if (!favoriteProducts.length) {
			target.html(
				'<div class="favorites-empty">' +
					'<i class="material-icons">favorite_border</i>' +
					'<strong>Aun no tienes favoritos</strong>' +
					'<p>Explora muebles y decoracion para guardar tus productos preferidos.</p>' +
					'<a class="link favorites-empty-link" href="/home/">Explorar catalogo</a>' +
				'</div>'
			);
			return;
		}
		var html = favoriteProducts.map(function (product) {
			var detailPath = getDetailPathByCategory(product.categoria);
			return '' +
				'<a class="fav-item link" href="' + detailPath + '?id=' + encodeURIComponent(product.id) + '" data-product-id="' + escapeHtml(product.id) + '">' +
					'<i class="material-icons">favorite</i>' +
					'<img src="' + escapeHtml(product.imagen) + '" alt="' + escapeHtml(product.nombre) + '">' +
					'<div class="fav-item-copy"><strong>' + escapeHtml(product.nombre) + '</strong><span>' + escapeHtml(product.subcategoria || product.categoria || '') + '</span></div>' +
					'<button class="fav-remove-btn" type="button" data-product-id="' + escapeHtml(product.id) + '" aria-label="Quitar de favoritos">Quitar</button>' +
					'<i class="material-icons fav-item-arrow">chevron_right</i>' +
				'</a>';
		}).join('');
		target.html(html);
	});
}

function buildOfferCardHtml(product, discount) {
	var detailPath = getDetailPathByCategory(product.categoria);
	return '' +
		'<a class="mini-card offer-card link" href="' + detailPath + '?id=' + encodeURIComponent(product.id) + '">' +
			'<span class="offer-tag">-' + discount + '%</span>' +
			'<img src="' + escapeHtml(product.imagen) + '" alt="' + escapeHtml(product.nombre) + '">' +
			'<p>' + escapeHtml(product.nombre) + '</p>' +
		'</a>';
}

function renderOffersFromCatalog(pageEl) {
	var target = $$(pageEl).find('.js-offers-sections');
	if (!target.length) {
		return Promise.resolve();
	}
	return loadCatalog().then(function (catalog) {
		var discountSteps = [15, 18, 20, 22, 25, 30, 35];
		var muebles = getCategoryProducts(catalog, 'muebles').slice(0, 6).map(function (item) {
			item.categoria = 'muebles';
			return item;
		});
		var decoracion = getCategoryProducts(catalog, 'decoracion').slice(0, 6).map(function (item) {
			item.categoria = 'decoracion';
			return item;
		});
		var html = '';
		html += '<h3 class="section-title">Muebles en oferta</h3>';
		html += '<div class="mini-cards">' + muebles.map(function (item, index) {
			return buildOfferCardHtml(item, discountSteps[index % discountSteps.length]);
		}).join('') + '</div>';
		html += '<h3 class="section-title">Decoracion en oferta</h3>';
		html += '<div class="mini-cards">' + decoracion.map(function (item, index) {
			return buildOfferCardHtml(item, discountSteps[(index + 2) % discountSteps.length]);
		}).join('') + '</div>';
		target.html(html);
	});
}

function productsBySubcategory(products) {
	var grouped = {};
	(products || []).forEach(function (item) {
		var groupName = item.subcategoria || 'General';
		if (!grouped[groupName]) {
			grouped[groupName] = [];
		}
		grouped[groupName].push(item);
	});
	return grouped;
}

function buildGalleryRowsHtml(categoryKey, products) {
	var groups = productsBySubcategory(products);
	var sections = [];
	Object.keys(groups).forEach(function (groupName) {
		var imagesHtml = groups[groupName].map(function (product) {
			return '<img src="' + escapeHtml(product.imagen) + '" alt="' + escapeHtml(product.nombre) + '" data-product-id="' + escapeHtml(product.id) + '">';
		}).join('');
		var detailPath = getDetailPathByCategory(categoryKey);
		sections.push(
			'<div class="section-band">' + escapeHtml(groupName) + '</div>' +
			'<div class="gallery-row" data-categoria="' + escapeHtml(categoryKey) + '">' +
				'<i class="material-icons arrow gallery-prev">chevron_left</i>' +
				imagesHtml +
				'<i class="material-icons arrow gallery-next">chevron_right</i>' +
				'<a href="' + detailPath + '" class="link gallery-product-link" aria-label="Abrir producto activo">' +
					'<i class="material-icons arrow">open_in_new</i>' +
				'</a>' +
			'</div>'
		);
	});
	if (!sections.length) {
		return '<div class="detail"><p>No hay productos cargados para esta categoria.</p></div>';
	}
	return sections.join('');
}

function setProductLinkForRow(row) {
	var activeImage = row.find('img.gallery-active');
	var productId = activeImage.attr('data-product-id');
	var categoryKey = row.attr('data-categoria') || 'muebles';
	var detailPath = getDetailPathByCategory(categoryKey);
	var detailUrl = detailPath + '?id=' + encodeURIComponent(productId || '');
	row.attr('data-gallery-product-id', productId || '');
	row.find('.gallery-product-link').attr('href', detailUrl);
}

function setActiveGalleryImage(row, nextIndex) {
	var images = row.find('img');
	if (!images.length) {
		return;
	}
	var safeIndex = ((nextIndex % images.length) + images.length) % images.length;
	row.attr('data-gallery-index', safeIndex);
	images.removeClass('gallery-active');
	images.eq(safeIndex).addClass('gallery-active');
	setProductLinkForRow(row);
}

function initGalleryRows(pageEl) {
	var rows = $$(pageEl).find('.gallery-row');
	if (!rows.length) {
		return;
	}
	rows.each(function () {
		var row = $$(this);
		if (row.attr('data-gallery-ready') === 'true') {
			setProductLinkForRow(row);
			return;
		}
		row.attr('data-gallery-ready', 'true');
		setActiveGalleryImage(row, 0);
	});
}

function renderGalleryFromCatalog(pageEl, categoryKey) {
	var target = $$(pageEl).find('.js-gallery-container');
	if (!target.length) {
		return Promise.resolve();
	}
	return loadCatalog().then(function (catalog) {
		var products = (catalog.categorias && catalog.categorias[categoryKey]) || [];
		target.html(buildGalleryRowsHtml(categoryKey, products));
	});
}

function buildProductDetailHtml(product, categoryKey) {
	if (!product) {
		return '<p>Producto no encontrado.</p>';
	}
	var isFavorite = isFavoriteProduct(product.id);
	var colors = (product.colores || []).map(function (color) {
		return '<span class="swatch" style="background:' + escapeHtml(color) + '"></span>';
	}).join('');
	var sizes = (product.tamanos || []).map(function (size) {
		return '<span class="size">' + escapeHtml(size) + '</span>';
	}).join('');
	return '' +
		'<img src="' + escapeHtml(product.imagen) + '" alt="' + escapeHtml(product.nombre) + '" style="width:100%; height:160px; object-fit:cover;">' +
		'<a href="#" class="link favorite-toggle' + (isFavorite ? ' favorite-toggle-active' : '') + '" data-product-id="' + escapeHtml(product.id) + '" data-categoria="' + escapeHtml(categoryKey) + '">' +
			'<i class="material-icons">' + (isFavorite ? 'favorite' : 'favorite_border') + '</i>' +
			'<span class="favorite-toggle-label">' + (isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos') + '</span>' +
		'</a>' +
		'<h2>' + escapeHtml(product.nombre) + '</h2>' +
		'<p>' + escapeHtml(product.descripcion || 'Sin descripcion disponible para este producto.') + '</p>' +
		'<h4>Disponible en:</h4>' +
		'<div class="swatches">' + colors + '</div>' +
		'<h4>En los tamanos:</h4>' +
		'<div class="sizes">' + sizes + '</div>';
}

function renderProductDetailFromCatalog(page, categoryKey) {
	var detailBox = $$(page.el).find('.js-product-detail');
	if (!detailBox.length) {
		return Promise.resolve();
	}
	return loadCatalog().then(function (catalog) {
		var products = (catalog.categorias && catalog.categorias[categoryKey]) || [];
		var productId = page.route && page.route.query ? page.route.query.id : null;
		var selected = null;
		if (productId) {
			selected = products.find(function (item) {
				return item.id === productId;
			});
		}
		if (!selected) {
			selected = products[0] || null;
		}
		detailBox.html(buildProductDetailHtml(selected, categoryKey));
		updateFavoriteToggleState(page.el);
	});
}

$$('.liveli-panel a').on('click', function (e) {
	var href = $$(this).attr('href');
	if (!href || href.charAt(0) !== '/') {
		return;
	}
	e.preventDefault();
	app.panel.close('left');
	if (app.views.main && app.views.main.router) {
		app.views.main.router.navigate(href);
	}
});

$$(document).on('click', '.sidebar-group-toggle', function (e) {
	e.preventDefault();
	var group = $$(this).closest('.sidebar-group');
	var isOpen = group.hasClass('sidebar-group-open');
	$$('.sidebar-group').removeClass('sidebar-group-open');
	if (!isOpen) {
		group.addClass('sidebar-group-open');
	}
});

$$(document).on('click', '.liveli-panel-social a', function (e) {
	e.preventDefault();
	e.stopPropagation();
	var href = $$(this).attr('href');
	if (!href) {
		return;
	}
	app.panel.close('left');
	window.open(href, '_blank', 'noopener,noreferrer');
});

// Bottom left icon toggles the sidebar panel on any page
$$(document).on('click', '.sidebar-toggle', function (e) {
	e.preventDefault();
	if (app.panel.left && app.panel.left.opened) {
		app.panel.close('left');
	} else {
		app.panel.open('left');
	}
});

app.on('pageInit', function (page) {
	if (!page || !page.el) {
		return;
	}
	if (page.name === 'muebles-galeria') {
		renderGalleryFromCatalog(page.el, 'muebles').then(function () {
			initGalleryRows(page.el);
		});
		return;
	}
	if (page.name === 'decoracion-galeria') {
		renderGalleryFromCatalog(page.el, 'decoracion').then(function () {
			initGalleryRows(page.el);
		});
		return;
	}
	if (page.name === 'home') {
		Promise.all([
			renderHomeHeroFromCatalog(page.el),
			renderHomeFromCatalog(page.el)
		]);
		return;
	}
	if (page.name === 'muebles') {
		renderCategoryContentFromCatalog(page.el, 'muebles');
		return;
	}
	if (page.name === 'decoracion') {
		renderCategoryContentFromCatalog(page.el, 'decoracion');
		return;
	}
	if (page.name === 'producto-mueble') {
		renderProductDetailFromCatalog(page, 'muebles');
		return;
	}
	if (page.name === 'producto-decoracion') {
		renderProductDetailFromCatalog(page, 'decoracion');
		return;
	}
	if (page.name === 'favoritos') {
		renderFavoritesFromCatalog(page.el);
		return;
	}
	if (page.name === 'ofertas') {
		renderOffersFromCatalog(page.el);
		return;
	}
	initGalleryRows(page.el);
});

$$(document).on('click', '.gallery-row .gallery-prev, .gallery-row .gallery-next', function (e) {
	e.preventDefault();
	var row = $$(this).closest('.gallery-row');
	var currentIndex = parseInt(row.attr('data-gallery-index') || '0', 10);
	var step = $$(this).hasClass('gallery-next') ? 1 : -1;
	setActiveGalleryImage(row, currentIndex + step);
});

$$(document).on('click', '.favorite-toggle', function (e) {
	e.preventDefault();
	var button = $$(this);
	var productId = button.attr('data-product-id');
	if (!productId) {
		return;
	}
	toggleFavoriteProduct(productId);
	updateFavoriteToggleState(button.closest('.page').length ? button.closest('.page') : document);
	if (app.views.main && app.views.main.router && app.views.main.router.currentRoute && app.views.main.router.currentRoute.name === 'favoritos') {
		renderFavoritesFromCatalog(app.views.main.router.currentPageEl);
	}
});

$$(document).on('click', '.fav-remove-btn', function (e) {
	e.preventDefault();
	e.stopPropagation();
	var productId = $$(this).attr('data-product-id');
	if (!productId) {
		return;
	}
	var ids = getFavoriteIds();
	var index = ids.indexOf(productId);
	if (index !== -1) {
		ids.splice(index, 1);
		saveFavoriteIds(ids);
	}
	if (app.views.main && app.views.main.router && app.views.main.router.currentPageEl) {
		renderFavoritesFromCatalog(app.views.main.router.currentPageEl);
	}
});

$$(document).on('click', '.top-search', function (e) {
	e.preventDefault();
	searchPopup.open();
	setTimeout(function () {
		var input = $$('.js-search-input');
		if (input.length) {
			input.val('');
			input[0].focus();
		}
		renderSearchResults('');
	}, 50);
});

$$(document).on('input', '.js-search-input', function () {
	renderSearchResults($$(this).val());
});
