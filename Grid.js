"use strict";

/// \brief read JSON to create a grid display
class Grid {
	#UA = ""; ///< user agent to determine browser compatibility

	/// \param [ in ] params : object with config parameters
	///     target : dom elements where the grid will be displayed
	///     config : grid config object (see README)
	///     callback : object with functions used after each grid display
	///         draw : called once the grid is drawed
	///         add : function called on param cell add request
	constructor ( params = {} )
	{
		if ( 0 < window.navigator.userAgent.indexOf ( "Chromium" ) )
		{
			this.#UA = "Chromium";
		}
		else if ( 0 < window.navigator.userAgent.indexOf ( "Chrome" ) )
		{
			this.#UA = "Chrome";
		}
		else if ( 0 < window.navigator.userAgent.indexOf ( "Safari" ) )
		{
			this.#UA = "Safari";
		}
		else if ( 0 < window.navigator.userAgent.indexOf ( "Firefox" ) )
		{
			this.#UA = "Firefox";
		}

		this.init ( params );

		this.draw ( "create", false );

		window.addEventListener ('resize',()=>{this.draw()});
	}

	init ( params = {} )
	{
		if ( params.target )
		{
			this.target = params.target;
		}
		if ( params.config )
		{
			this.config = params.config;
		}
		if ( params.callback )
		{
			this.callback = params.callback;
		}
	}

	/// \brief wrapper for draw function used for compatibility
	update ( event_id )
	{
		this.draw ( event_id, false );
	}

	/// \brief function who draw the grid
	/// \param [ in ] event : event passed to callback function
	/// \param [ in ] checked : boolean, used if configbox definedin config
	draw ( event, checked = false )
	{
		if ( !this.target )
		{
			return;
		}

		// remove elements not created by Grid.js
		for ( let c of this.target.children )
		{
			if ( ( c == this.table )
				|| ( c == this.style )
				|| ( c == this.input ) )
			{
				continue;
			}

			this.target.removeChild( c );
		}
	
		// add config and style div
		if ( this.config.configBox
			&& this.config.configBox.id )
		{ // create the buttons
			if ( undefined == this.style )
			{
				this.style = document.createElement ( "style" );
				this.style.innerHTML = '#'+this.config.configBox.id+'{display:none}\n'
				+'#'+this.config.configBox.id+' + table .gridHide {display:none}\n'
				+'#'+this.config.configBox.id+':checked + table button.gridHide {display:block}\n'
				+'#'+this.config.configBox.id+':checked + table tr.gridHide {display:table-row}\n'
				+'#'+this.config.configBox.id+' + table .'+this.config.configBox.id+') {color:red}\n'
				+'#'+this.config.configBox.id+':checked + table .'+this.config.configBox.id+' {display:inherit}\n'

				this.target.appendChild ( this.style );
			}

			if ( undefined == this.input )
			{
				this.input = document.createElement ( "input" );
				this.input.id = this.config.configBox.id;
				this.input.type = 'checkbox'
				this.input.checked = checked;
				this.input.onchange = (ev)=>{
					this.paramDiv.style.display = ev.target.checked ? "" : "none";
				}
				
				this.target.appendChild ( this.input );
			}
		}

		// calc grid size
		let nbCols = 1;
		if ( ( "String" == this.config.size?.constructor.name )
			&& ( 0 < this.config.size.indexOf ( "%" ) ) )
		{
			nbCols = Math.floor ( 100 / this.config.size.replace ( "%", "" ) );
			if ( !isNaN ( this.config.minSize )
				&& ( this.target.clientWidth / nbCols < this.config.minSize ) )
			{
				nbCols = Math.floor ( ( this.target.clientWidth ) / this.config.minSize );
			}
		}
		else if ( ! isNaN ( this.config.size ) )
		{
			nbCols = Math.floor ( ( this.target.clientWidth ) / this.config.size );
		}

		if ( nbCols <= 0 )
		{
			nbCols = 1;
		}

		let width = ( this.target.clientWidth ) / nbCols;

		let rowId = 0;
		let rowLastId = undefined;
		let colUsed = [];
		let colPrevious = [];
		
		// create grid
		if ( undefined == this.table )
		{
			this.table = document.createElement ( "table" );
			this.target.appendChild ( this.table );
		}
		else
		{
			let table = document.createElement ( "table" );
			this.table.replaceWith ( table );
			this.table = table;
		}

		this.table.classList = "grid"
		this.table.style.width = "100%"
		this.table.style.tableLayout = "fixed"

		// feed grid
		let line = document.createElement( "tr" );
		let index = 0;
		if ( !this.config.dataset )
		{
			this.config.dataset = [];
		}

		while ( true )
		{
			if ( ( this.config.editable )
				&& ( index == this.config.dataset.length ) )
			{ // if dataset is editable
			}
			else if ( index >= this.config.dataset.length )
			{ // index out of array
				this.table.appendChild ( line );
				while ( colUsed[ rowId + 1 ] )
				{ // no cell remainning but need more row
					rowId++;
					this.table.appendChild ( document.createElement( "tr" ) );
				}

				break;
			}

			if ( colPrevious.includes ( index ) )
			{ // if the current index element is already displayed
				colPrevious.splice( colPrevious.indexOf( index ), 1)
				index++;
				continue;
			}

			while ( this._isRowfull ( colUsed, rowId, nbCols ) )
			{ // if the row is full
				rowId++;
				this.table.appendChild ( line );
				line = document.createElement( "tr" );
			}

			// get the size of the next empty cell
			let nextEmpty = this._getNextEmptycell ( colUsed, rowId, nbCols );

			// last line empty with paramBox
			if ( ( index == this.config.dataset.length )
				&& ( nextEmpty.size == nbCols ) )
			{
				line.classList.add ( "gridHide" );
			}

			// search the next element to be displayed
			let next = index;
			if ( nextEmpty.size == nbCols )
			{ // if the row is empty, the next element is the current
			}
			else do 
			{ // else search an element with the good size
				next = this._getNextCell ( next, nextEmpty.size );

				if ( colPrevious.includes ( next ) )
				{
					next++;
				}
				else
				{
					break;
				}
			} 
			while ( true );

			if ( next == -1 )
			{ // all remainning elements are larger than the remainning
				// space in the line
				rowId++;
				this.table.appendChild ( line );
				line = document.createElement( "tr" );
				continue;
			}

			// create new element
			let cell = this._getCell ( next );
			if ( nbCols >= cell.colSpan )
			{
				cell.style.width = ( cell.colSpan / nbCols * 100 )+'%';
			}
			else
			{
				cell.style.width = '100%';
			}

			if ( cell.colSpan > nbCols )
			{
				cell.colSpan = nbCols;
			}
			line.appendChild ( cell );
			
			// update lines size
			this._updateColUsed ( next, colUsed, nextEmpty.index, rowId );
			
			if ( next != index )
			{ // save the element
				colPrevious.push( next );
			}
			else
			{
				index++;
			}
		}

		if ( ( this.callback )
			&& ( this.callback.draw ) )
		{
			this.callback.draw ( event )
		}
	}

	/// \brief graw a cell, an give it to the caller
	/// \param [ in ] index : index of the data used to feed the cell content from dataset config
	/// \return a full cell
	_getCell ( index )
	{
		if ( index == this.config.dataset.length )
		{
			return this._getParamCell ( this.config.dataset.length );
		}

		this.config.dataset[ index ].cell = document.createElement ( "td" );
		this.config.dataset[ index ].cell.id = "cel_"+index
		this.config.dataset[ index ].cell.classList = "gridCell"
		switch ( this.#UA )
		{
			case "Chromium":
			case "Chrome":
				this.config.dataset[ index ].cell.style.height = "1px";
				break;
			case "Firefox":
				this.config.dataset[ index ].cell.style.height = '100%';
				break;
		}
		this.config.dataset[ index ].cell.colSpan = this.config.dataset[ index ].x
		this.config.dataset[ index ].cell.rowSpan = this.config.dataset[ index ].y

		let div = document.createElement ( "div" );
		div.style.height = '100%';
		div.style.width = '100%';
		div.style.display = 'flex';
		div.style.position = "relative";
		div.style.alignItems = 'center';
		div.style.justifyContent = "space-between";

		this.config.dataset[ index ].cell.appendChild ( div );

		if ( this.config.dataset[ index ].el )
		{
			this.config.dataset[ index ].el.style.flexGrow = 1;
			this.config.dataset[ index ].el.style.height = '100%';
			this.config.dataset[ index ].el.style.overflow = 'auto';
			div.appendChild ( this.config.dataset[ index ].el );
		}

		if ( !this.config.buttons )
		{

		}
		else for ( let item of [ "up", "down", "remove", "update", "index" ] )
		{
			if ( !this.config.buttons[ item ] )
			{
				continue;
			}

			let button = document.createElement ( "button" );
			div.appendChild ( button );
			button.style.cssText = this.config.buttons[ item ].cssText || "";
			button.innerHTML = this.config.buttons[ item ].innerHTML || "";
			button.style.position ||= "absolute";
			button.style.fontSize ||= "1em";
			button.classList.add ( "gridHide" );

			button.title = index;
			button.addEventListener ( "click", (e)=>{
				this._change(e,item);

				if ( ( this.callback )
					&& ( this.callback[ item ] ) )
				{
					this.callback[ item ] ( e, index );
				}
			});

			switch ( item )
			{
				case "up":
				{
					button.innerHTML ||= "&#x21E6";
					button.style.left ||= 0;
					break;
				}
				case "down":
				{
					button.innerHTML ||= "&#x21E8";
					button.style.right ||= 0;
					break;
				}
				case "remove":
				{
					button.innerHTML ||= "&#x274C;";
					button.style.fontWeight ||= "bold";
					button.style.top ||= 0;
					button.style.right ||= 0;
					button.style.height ||= "1.3em";
					break;	
				}
				case "update":
				{
					button.innerHTML ||= "&#8635;";
					button.style.fontWeight ||= "bold";
					button.style.top ||= 0;
					button.style.right ||= "1.4em";
					button.style.height ||= "1.3em";
					break;
				}
				case "index":
				{
					button.innerHTML = index;
					button.style.top ||= 0;
					button.style.left ||= 0;
					button.style.width ||= "1.3em";
					button.style.height ||= "1.3em";
					break;
				}
			}
		}

		return this.config.dataset[ index ].cell
	}

	/// \brief create a cell used to request add
	/// \param [ in ] index : index used to set cell ID
	_getParamCell ( index )
	{
		this.paramDiv = document.createElement ( "td" );
		this.paramDiv.id = "cel_"+index
		this.paramDiv.classList = "gridCell"
		this.paramDiv.style.height = '100%';
		this.paramDiv.style.display = ( this.input && this.input.checked )?"":"none";
		this.paramDiv.colSpan = 1;
		this.paramDiv.rowSpan = 1;

		let div = document.createElement ( "div" );
		div.className = this.config.configBox.id;
		div.style.height = '100%';
		div.style.width = '100%';
		div.style.display = 'flex';
		div.style.position = "relative";
		div.style.alignItems = 'center';
		div.style.justifyContent = "space-between";
		div.style.cursor = "pointer";
		div.style.fontSize = "3em";
		div.style.justifyContent = "center";
		div.appendChild ( document.createTextNode ( '+' ) );

		if ( ( this.callback )
			&& ( this.callback.add ) )
		{
			div.onclick = this.callback.add;
		}

		this.paramDiv.appendChild ( div );
		
		return this.paramDiv;
	}

	/// \brief function used on order change request 
	/// \param [ in ] e : event object
	/// \param [ in ] mode : change request mode
	_change ( e, mode )
	{
		let el = e.target;
		while ( !el.id )
		{
			if ( el.nodeName == "BODY" )
			{
				return;
			}
			el = el.parentNode;
		}
		let ori = el.id;

		let index = 0;
		while ( index < this.config.dataset.length )
		{
			if ( this.config.dataset[ index ].cell.id == ori )
			{
				break;
			}
			index++;
		}

		switch ( mode )
		{
			case "up":
			{
				if ( index <= 0 )
				{
					return;
				}
				this.config.dataset.splice ( index-1, 0, this.config.dataset.splice ( index, 1 )[0] );
				break;
			}
			case "down":
			{
				if ( index >= this.config.dataset.length )
				{
					return;
				}
				this.config.dataset.splice ( index+1, 0, this.config.dataset.splice ( index, 1 )[0] );
				break;
			}
			case "remove":
			{
				if ( index >= this.config.dataset.length )
				{
					return;
				}
				this.config.dataset.splice ( index, 1 );
				break;
			}
		}

		this.draw ( "update", true );
	}

	/// \brief function used to get the next cell who fit in the remaining place
	/// \param [ in ] index : index of the first cell not added to the grid
	/// \param [ in ] size : remaining place in the current line of the grid
	/// \return index of the nex cell who fit else -1 if no cell fit
	_getNextCell ( index, size )
	{
		if ( index == this.config.dataset.length )
		{
			return this.config.dataset.length;
		}
		while ( index < this.config.dataset.length )
		{
			if ( this.config.dataset[ index ].x <= size )
			{
				return index
			}
			index++;
		}
		return -1;
	}

	/// \brief function used to update the backup of the placement in grid and set colSpan/rowSpan
	/// \param [ in ] index : index of the celle to add in grid
	/// \param [ in ] colUsed : table who represent the grid
	/// \param [ in ] colId : index of curent col
	/// \param [ in ] rowId : index of current row
	_updateColUsed ( index, colUsed, colId, rowId )
	{
		let horizontal = undefined;
		if ( this.config.dataset[ index ] )
		{
			horizontal = this.config.dataset[ index ].x;
		}
		else
		{
			horizontal = this.paramDiv.colSpan;
		}

		let vertical = undefined;
		if ( this.config.dataset[ index ] )
		{
			vertical = this.config.dataset[ index ].y;
		}
		else
		{
			vertical = this.paramDiv.rowSpan;
		}

		for ( let j = 0; j < vertical; j++ )
		{
			if ( colUsed[ rowId + j ] == undefined )
			{
				colUsed[ rowId + j ] = [];
			}
			
			for ( let i = 0; i < horizontal; i++ )
			{
				colUsed[ rowId + j ][ colId + i] = index;
			}
		}
	}

	/// \brief check if row is full or not
	/// \param [ in ] colUsed : table who represent the grid
	/// \param [ in ] rowId : index of current row
	/// \param [ in ] nbCols : number of of cols in the table
	/// \return true if full and false if not full
	_isRowfull (  colUsed, rowId, nbCols )
	{
		if ( !colUsed[ rowId ]
			|| colUsed[ rowId ].length < nbCols )
		{
			return false;
		}
		else for ( let i = 0; i < nbCols; i++ )
		{
			if ( isNaN( colUsed[ rowId ][ i ] ) )
			{
				console.log( nbCols +" : "+ i )
				return false;
			}
		}
		return true;
	}

	/// \brief get teh next empty cell index and size
	/// \param [ in ] colUsed : table who represent the grid
	/// \param [ in ] rowId : index of current row
	/// \param [ in ] nbCols : number of of cols in the table
	/// \return object whit index and size
	_getNextEmptycell ( colUsed, rowId, nbCols )
	{
		if ( !colUsed[ rowId ] )
		{
			return { index:0, size:nbCols };
		}

		let size = 0;
		let i = 0;
		let index = undefined;
		while ( i < nbCols )
		{
			if ( !isNaN( colUsed[ rowId ][ i ] ) && size )
			{
				break;
			}
			if ( isNaN( colUsed[ rowId ][ i ] ) )
			{
				if ( index == undefined )
				{
					index = i;
				}
				size++;
			}
			i++;
		}
		// console.log( colUsed[ rowId ] )
		return { index:index, size:size };
	}
}