window.addEventListener('scroll', function() {
    const header = document.querySelector('header');
    if (window.scrollY > 50) { // You can adjust the scroll distance
        header.style.backgroundColor = 'rgba(217, 217, 217, 0.3)'; // More transparent
    } else {
        header.style.backgroundColor = 'rgba(217, 217, 217, 1)'; // Solid gray
    }
});

function landingPage() {
    document.getElementById("landingPage").scrollIntoView({
        behavior: 'smooth',
        block: "start"
    });

}
$(document).ready(function() {
    $('nav ul li a:not(:only-child)').click(function(e) {
        $(this).siblings('.nav-dropdown').toggle();
        e.stopPropagation();
    });

    $('html').click(function(){
        $('.nav-dropdown').hide();
    })
    $('#nav-toggle').click(function(){
        $('nav ul').slideToggle();
    })
    $('#nav-toggle').on('click', function(){
        this.classList.toggle('active');
    });
});
function toggleLoginFlyout(event) {
    if (event) event.preventDefault(); // Prevent the default anchor behavior
    const flyout = document.getElementById('LoginFlyout');
    flyout.classList.toggle('active'); // Toggle the active class
}

// Dummy function for login submission
function submitLogin() {
    toggleLoginFlyout(); // Optionally close the flyout after submission
}

// Close the login flyout when clicking outside of it
window.onclick = function(event) {
    const flyout = document.getElementById('LoginFlyout');
    if (event.target === flyout) {
        flyout.classList.remove('active');
    }
}

function toggleAdminFlyout(event) {
    if (event) event.preventDefault(); // Prevent the default anchor behavior
    const flyout = document.getElementById('AdminFlyout');
    flyout.classList.toggle('active'); // Toggle the active class
}

// Dummy function for Admin Submissions
function submitAdmin() {
    toggleAdminFlyout(); // Optionally close the flyout after submission
}

// Close the login flyout when clicking outside of it
window.onclick = function(event) {
    const flyout = document.getElementById('AdminFlyout');
    if (event.target === flyout) {
        flyout.classList.remove('active');
    }
}

//admin
const allSideMenu = document.querySelectorAll('#sidebar .side-menu.top li a');

allSideMenu.forEach(item=> {
	const li = item.parentElement;

	item.addEventListener('click', function () {
		allSideMenu.forEach(i=> {
			i.parentElement.classList.remove('active');
		})
		li.classList.add('active');
	})
});




// TOGGLE SIDEBAR
const menuBar = document.querySelector('#content nav .bx.bx-menu');
const sidebar = document.getElementById('sidebar');

menuBar.addEventListener('click', function () {
	sidebar.classList.toggle('hide');
})







const searchButton = document.querySelector('#content nav form .form-input button');
const searchButtonIcon = document.querySelector('#content nav form .form-input button .bx');
const searchForm = document.querySelector('#content nav form');

searchButton.addEventListener('click', function (e) {
	if(window.innerWidth < 576) {
		e.preventDefault();
		searchForm.classList.toggle('show');
		if(searchForm.classList.contains('show')) {
			searchButtonIcon.classList.replace('bx-search', 'bx-x');
		} else {
			searchButtonIcon.classList.replace('bx-x', 'bx-search');
		}
	}
})





if(window.innerWidth < 768) {
	sidebar.classList.add('hide');
} else if(window.innerWidth > 576) {
	searchButtonIcon.classList.replace('bx-x', 'bx-search');
	searchForm.classList.remove('show');
}


window.addEventListener('resize', function () {
	if(this.innerWidth > 576) {
		searchButtonIcon.classList.replace('bx-x', 'bx-search');
		searchForm.classList.remove('show');
	}
})



const switchMode = document.getElementById('switch-mode');

switchMode.addEventListener('change', function () {
	if(this.checked) {
		document.body.classList.add('dark');
	} else {
		document.body.classList.remove('dark');
	}
})