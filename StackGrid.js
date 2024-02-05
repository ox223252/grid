"use strict";

class StackGrid {
	constructor ( target, options = {} ) {
		this.target = target;
		this.options = options;

		this.draw ( );

		window.addEventListener ('resize',()=>{this.draw()});
	}
	draw ( force )
	{
		this.target.style.display = "flex";
		this.target.style.alignItems = "flex-start";
		this.target.style.justifyContent = "space-evenly";

		let width = this.target.getAttribute( "data-grid-width" );
		let raw = this.target.getElementsByClassName( "grid-raw" );


		// calc grid size
		let column = 1;
		if ( 0 < this.config.size.indexOf ( "%" ) )
		{
			column = Math.floor ( 100 / this.config.size.replace ( "%", "" ) );
			if ( !isNaN ( this.config.minSize )
				&& ( this.target.clientWidth / column < this.config.minSize ) )
			{
				column = Math.floor ( ( this.target.clientWidth ) / this.config.minSize );
			}
		}
		else if ( ! isNaN ( this.config.size ) )
		{
			column = Math.floor ( ( this.target.clientWidth ) / this.config.size );
		}

		if ( column <= 0 )
		{
			column = 1;
		}
		
		let divs = this.target.getElementsByClassName( "grid-column" );

		// if not the correct number of column
		if ( ( divs.length != column ) ||
			( force = true ) );
		{
			// put all data in a div to save normal order
			// if its not already done
			if ( raw.length == 0 )
			{
				let node = document.createElement( "div" );
				node.classList.add( "grid-raw" );
			
				let els = this.target.getElementsByClassName( "grid-content" );

				for ( let j = 0; els.length > 0; j++ )
				{
					els[ 0 ].style.width = "100%";
					node.appendChild( els[ 0 ] );
				}
				this.target.appendChild( node );
				raw = this.target.getElementsByClassName( "grid-raw" );
			}

			// clone elements
			let nodes = raw[ 0 ].cloneNode( true );
			// hidde backup
			raw[ 0 ].style.display = "none";

			// get content of clone
			let els = nodes.getElementsByClassName( "grid-content" );

			// remove olds columns
			for ( let j = ( divs.length - 1 ); j >= 0; j-- )
			{
				this.target.removeChild( divs[ j ] );
			}
			
			// create new columns
			for ( let j = 0; j < column; j++ )
			{
				let node = document.createElement( "div" );
				node.style.maxWidth = width+"px";
				node.id = "div_"+j;
				node.classList.add( "grid-column" );
				this.target.insertBefore( node, this.target.childNodes[ j ] );
			}

			// put conned contents in columns
			for ( let j = 0; els.length > 0; j++ )
			{
				let next = 0;
				for ( let k = 1; k < column; k++ )
				{
					if ( this.target.children[ next ].clientHeight > this.target.children[ k ].clientHeight)
					{
						next = k;
					}
				}
				this.target.children[ next ].appendChild( els[ 0 ] );
			}
		}

		let anchor = location.href.substring(location.href.indexOf("#")+1);

		if ( anchor )
		{
			let el = document.getElementById( anchor );
			if ( el )
			{
				window.scrollTo( 0, el.offsetTop );
			}
		}
	}
	change ( value, grid = this.target )
	{
		let width = grid.setAttribute( "data-grid-width", value );

		this.draw ( );
	}
}