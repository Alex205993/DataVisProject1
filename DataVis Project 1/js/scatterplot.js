class Scatterplot {

    /**
     * Class constructor with basic chart configuration
     * @param {Object}
     * @param {Array}
     */
    constructor(_config, _data) {
      this.config = {
        parentElement: _config.parentElement,
        containerWidth: _config.containerWidth || 800,
        containerHeight: _config.containerHeight || 650,
        margin: _config.margin || {top: 50, right: 100, bottom: 50, left: 100},
        tooltipPadding: _config.tooltipPadding || 15
      }
      this.data = _data;
      this.idleTimeout;
      this.initVis();
    }
    
    initVis() {
      let vis = this;

      vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
      vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;
  
      
      vis.colorScale = d3.scaleOrdinal()
        .range(['#02ed35', '#022aed', '#ed021e'])
        .domain(['Rural','Suburban','Small City']);
      
      vis.xScale = d3.scaleLinear()
          .range([0, vis.width]);
  
      vis.yScale = d3.scaleLinear()
          .range([vis.height, 0]);

      vis.xAxis = d3.axisBottom(vis.xScale);
      vis.yAxis = d3.axisLeft(vis.yScale);
          
      vis.svg = d3.select(vis.config.parentElement)
          .attr('width', vis.config.containerWidth)
          .attr('height', vis.config.containerHeight);

      vis.chart = vis.svg.append('g')
          .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`)
          .attr("class", "chart");

      vis.dataGroup = vis.chart.append('g')
          .attr("class","dataGroup");

      vis.xAxisG = vis.chart.append('g')
          .attr('class', 'axis x-axis')
          .attr('transform', `translate(0,${vis.height})`);
      
      vis.yAxisG = vis.chart.append('g')
          .attr('class', 'axis y-axis');
      
      vis.chart.append('text')
      .attr('class', 'axis-title x-axis-title')
      .attr('y', vis.height + 40)
      .attr('x', vis.width/2)
      .attr('text-anchor', 'end')

      vis.svg.append('text')
        .attr('class', 'axis-title y-axis-title')
        .attr('text-anchor', 'end')
        .attr('y', 20)
        .attr('x', -200)
        .attr('dy', '.75em')
        .attr('transform', 'rotate(-90)')

      vis.clip = vis.svg.append("defs").append("svg:clipPath")
        .attr("id","clip")
        .append("svg:rect")
        .attr("width",vis.width)
        .attr("height",vis.height)
        .attr("x",0)
        .attr("y",0);

      vis.brush = d3.brushX()
        .extent([[0,0], [vis.width, vis.height]])
        .on("end", (e) => this.updateChart(e))

    }
  
    
    updateVis(attr1, attr2, attributeText1, attributeText2) {
      let vis = this;
      
      vis.colorValue = d => d.urban_rural_status; 
      vis.xValue = d => d[attr1];
      vis.yValue = d => d[attr2];
  
      vis.xScale.domain([0, d3.max(vis.data, vis.xValue)]);
      vis.yScale.domain([0, d3.max(vis.data, vis.yValue)]);

      vis.chart.select('.x-axis-title')
        .text(attributeText1);

      vis.svg.select('.y-axis-title')
        .text(attributeText2);
  
      vis.renderVis(attr1, attr2, attributeText1, attributeText2);
    }
  
    /**
     * Bind data to visual elements.
     */
    renderVis(attr1, attr2, attributeText1, attributeText2) {
      let vis = this;

      const filteredData = vis.data.filter(d => d[attr1]!= -1 && d[attr2] != -1);
      
      // Add circles
      const circles = vis.dataGroup.selectAll('.point')
          .data(filteredData, d => d.display_name)
        .join('circle')
          .attr('class', 'point')
          .attr('r', 4)
          .attr('cy', d => vis.yScale(vis.yValue(d)))
          .attr('cx', d => vis.xScale(vis.xValue(d)))
          .attr('fill-opacity',0.5)
          .attr('fill', d => vis.colorScale(vis.colorValue(d)));
  
      
      // Tooltip event listeners
      circles
          .on('mouseover', (event,d) => {
            d3.select('#tooltip')
              .style('display', 'block')
              .style('left', (event.pageX + vis.config.tooltipPadding) + 'px')   
              .style('top', (event.pageY + vis.config.tooltipPadding) + 'px')
              .html(`
                <div class="tooltip-title">${d.display_name}</div>
                <ul>
                  <li>${attributeText1} : ${d[attr1]}</li>
                  <li>${attributeText2} : ${d[attr2]}</li>
                  <li> Urban/Rural Status : ${d.urban_rural_status}</li>
                </ul>
              `);
              
          })
          .on('mouseleave', () => {
            d3.select('#tooltip').style('display', 'none');
          });

      vis.brushing = vis.chart.append("g")
          .attr("class", "brush")
          .call(vis.brush);
      
      vis.xAxisG
          .call(vis.xAxis)
          .call(g => g.select('.domain').remove());
  
      vis.yAxisG
          .call(vis.yAxis)
          .call(g => g.select('.domain').remove());
    }

    idled(){
      this.idleTimeout = null;
    }
    updateChart(e){

      let vis = this;
      let extent = e.selection;
      if(!extent){
        if(!this.idleTimeout){
          return this.idleTimeout = setTimeout(vis.idled(), 30);
        }
        vis.xScale.domain([0, d3.max(vis.data, vis.xValue)]);

      }
      else{
        vis.xScale.domain([vis.xScale.invert(extent[0]), vis.xScale.invert(extent[1])]);
        vis.brushing.select(".brush").call(vis.brush.move, null)
      }
      vis.xAxisG.transition().duration(1000).call(d3.axisBottom(vis.xScale));
      vis.chart.selectAll(".point")
      .transition().duration(1000)
      .attr("cx", d => vis.xScale(vis.xValue(d)))
      .attr("cy",d => vis.yScale(vis.yValue(d)));
    }

    
  }