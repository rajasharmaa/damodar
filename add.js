document.addEventListener('DOMContentLoaded', function() {
  const mediaContainer = document.getElementById('mediaContainer');
  const API_BASE_URL = 'https://686fdbf5c817f20ef495d5ac--charming-gumption-ebc6bd.netlify.app/api';
  const defaultImage = "assets/Screenshot_2025-06-19_201249-removebg-preview.png";
  
  // Local storage fallback data
  const mediaImages = JSON.parse(localStorage.getItem('mediaImages') || JSON.stringify([defaultImage]));
  const productDetails = JSON.parse(localStorage.getItem('productDetails') || '{}');

  async function loadProducts() {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const category = urlParams.get('category');
      
      let endpoint = '/products';
      if (category) {
        endpoint = `/products/category/${encodeURIComponent(category)}`;
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const products = await response.json();
      displayProducts(products);
      
      // Store products in local storage as fallback
      const productsMap = {};
      products.forEach(product => {
        productsMap[product._id] = product;
      });
      localStorage.setItem('productDetails', JSON.stringify(productsMap));
      
      // Initialize animations after products are loaded
      initAnimations();
    } catch (error) {
      console.error('Error fetching products:', error);
      // Fallback to local storage data
      const fallbackProducts = Object.values(productDetails);
      displayProducts(fallbackProducts);
      initAnimations();
    }
  }

  function displayProducts(products) {
    mediaContainer.innerHTML = '';
    
    if (products.length === 0) {
      mediaContainer.innerHTML = '<p style="text-align: center; padding: 20px;">No products found in this category.</p>';
      return;
    }
    
    products.forEach((product, index) => {
      const mediaLink = document.createElement('a');
      mediaLink.href = `product-details.html?id=${product._id}`;
      mediaLink.style.textDecoration = 'none';
      mediaLink.style.color = 'inherit';
      
      const mediaDiv = document.createElement('div');
      mediaDiv.classList.add('media', `media${index + 1}`);
      
      // Add hover effects
      mediaDiv.style.transition = 'transform 0.3s, box-shadow 0.3s';
      mediaDiv.style.cursor = 'pointer';
      mediaDiv.addEventListener('mouseenter', () => {
        mediaDiv.style.transform = 'translateY(-5px)';
        mediaDiv.style.boxShadow = '0 10px 20px rgba(0,0,0,0.1)';
      });
      mediaDiv.addEventListener('mouseleave', () => {
        mediaDiv.style.transform = 'translateY(0)';
        mediaDiv.style.boxShadow = 'none';
      });

      const img = document.createElement('img');
      img.src = product.image || product.imagePath || product || defaultImage;
      img.alt = product.name || `Product ${index + 1}`;
      img.loading = "lazy";
      
    
      
      mediaDiv.appendChild(img);
      
      mediaLink.appendChild(mediaDiv);
      mediaContainer.appendChild(mediaLink);
    });
  }

  function initAnimations() {
    // ScrollTrigger animation for when mediaContainer enters viewport
    ScrollTrigger.create({
      trigger: "#mediaContainer",
      start: "top bottom",
      onEnter: () => {
        gsap.from(".media", {
          y: 10,
          opacity: 0,
          duration: 0.9,
          stagger: 0.15,
          ease: "back.out(1.7)"
        });
      }
    });

    // Mouse movement inertia effect for media elements
    let oldX = 0, 
        oldY = 0, 
        deltaX = 0,
        deltaY = 0;
    
    document.querySelectorAll('.media').forEach(el => {
      el.addEventListener('mouseenter', () => {
        const tl = gsap.timeline({ 
          onComplete: () => {
            tl.kill();
          }
        });
        tl.timeScale(1.2);
        
        const image = el.querySelector('img');
        tl.to(image, {
          inertia: {
            x: {
              velocity: deltaX * 30,
              end: 0
            },
            y: {
              velocity: deltaY * 30,
              end: 0
            },
          },
        });
        tl.fromTo(image, {
          rotate: 0
        }, {
          duration: 0.4,
          rotate: (Math.random() - 0.5) * 30,
          yoyo: true, 
          repeat: 1,
          ease: 'power1.inOut'
        }, '<');
      });
    });

    // Track mouse movement for inertia effect
    document.addEventListener("mousemove", (e) => {
      deltaX = e.clientX - oldX;
      deltaY = e.clientY - oldY;
      oldX = e.clientX;
      oldY = e.clientY;
    });
  }

  // Load products when page loads
  loadProducts();
});
